import './bluetooth.d';

export interface PrinterDevice {
  device: BluetoothDevice;
  server?: BluetoothRemoteGATTServer;
  service?: BluetoothRemoteGATTService;
  characteristic?: BluetoothRemoteGATTCharacteristic;
}

export interface ReceiptData {
  storeName: string;
  storeAddress?: string;
  footerNote?: string;
  transactionId: string;
  date: Date | string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total?: number;
  }>;
  subtotal: number;
  tax?: number;
  total: number;
  payment: number;
  change: number;
  paymentMethod?: string;
}

class BluetoothPrinterService {
  private device: PrinterDevice | null = null;
  // Common Service UUIDs for thermal printers
  private readonly SERVICE_UUIDS = [
    '000018f0-0000-1000-8000-00805f9b34fb', // Standard 18f0
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Some generic printers
    '0000ff00-0000-1000-8000-00805f9b34fb', // Generic serial
    '49535343-fe7d-4ae5-8fa9-9fafd205e455'  // ISSC Transparent
  ];

  // Common Characteristic UUIDs for writing data
  private readonly CHARACTERISTIC_UUIDS = [
    '00002af1-0000-1000-8000-00805f9b34fb', // Standard 2af1
    'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f', // Paired with e781...
    '0000ff02-0000-1000-8000-00805f9b34fb', // Generic serial write
    '49535343-8841-43f4-a8d4-ecbe34729bb3'  // ISSC Transparent Write
  ];

  async connect(): Promise<PrinterDevice> {
    try {
      if (typeof navigator === 'undefined' || !navigator.bluetooth) {
        throw new Error('Browser ini tidak mendukung Bluetooth. Gunakan Chrome atau Edge (Android/PC). Safari/iOS TIDAK didukung.');
      }

      if (!window.isSecureContext) {
        throw new Error('Bluetooth memerlukan koneksi aman (HTTPS) atau localhost.');
      }

      // 1. Request Device
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [...this.SERVICE_UUIDS] // Must list ALL potential services here
      });

      device.addEventListener('gattserverdisconnected', this.onDisconnected);

      return await this.startConnection(device);
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      throw error;
    }
  }

  private onDisconnected = async (event: Event) => {
    const device = event.target as unknown as BluetoothDevice;
    console.log('Bluetooth Printer disconnected:', device.name);

    // Jika device masih tersimpan di state (artinya bukan disconnect manual), coba reconnect
    if (this.device && this.device.device.id === device.id) {
      console.log('Mencoba menghubungkan kembali secara otomatis...');
      try {
        await this.startConnection(device);
        console.log('Printer berhasil terhubung kembali otomatis.');
      } catch (e) {
        console.error('Gagal menghubungkan kembali otomatis:', e);
      }
    }
  };

  private async startConnection(device: BluetoothDevice): Promise<PrinterDevice> {
    // 2. Connect to Server
    const server = await device.gatt?.connect();
    if (!server) throw new Error('Gagal terhubung ke server Bluetooth (GATT)');

    // 3. Find Working Service & Characteristic
    let service: BluetoothRemoteGATTService | undefined;
    let characteristic: BluetoothRemoteGATTCharacteristic | undefined;

    // Try finding a primary service from our list
    for (const uuid of this.SERVICE_UUIDS) {
      try {
        service = await server.getPrimaryService(uuid);
        console.log(`Connected to Service: ${uuid}`);

        // If service found, try to find a writable characteristic in it
        const characteristics = await service.getCharacteristics();

        // Try to match with known characteristic UUIDs or find any writable one
        for (const c of characteristics) {
          const props = c.properties;
          if (props.write || props.writeWithoutResponse) {
            // If it matches our known list, prioritize it, otherwise take the first writable
            if (this.CHARACTERISTIC_UUIDS.includes(c.uuid)) {
              characteristic = c;
              break;
            }
            // Fallback: save this writable one in case we don't find a perfect match
            if (!characteristic) characteristic = c;
          }
        }

        if (characteristic) {
          console.log(`Found Characteristic: ${characteristic.uuid}`);
          break; // Success!
        }

      } catch (e) {
        // Continue to next service
      }
    }

    if (!service || !characteristic) {
      throw new Error('Layanan Printer tidak didukung. UUID Service/Characteristic tidak cocok.');
    }

    this.device = {
      device,
      server,
      service,
      characteristic
    };

    return this.device;
  }

  async disconnect(): Promise<void> {
    if (this.device?.device) {
      this.device.device.removeEventListener('gattserverdisconnected', this.onDisconnected);
    }
    if (this.device?.server?.connected) {
      this.device.server.disconnect();
    }
    this.device = null;
  }

  isConnected(): boolean {
    return this.device?.server?.connected ?? false;
  }

  getPrinterName(): string | undefined {
    return this.device?.device.name;
  }

  async printReceipt(data: ReceiptData): Promise<void> {
    if (!this.device?.characteristic) {
      throw new Error('Printer not connected');
    }

    const commands: number[] = [];
    const PRINTER_WIDTH = 32;

    // ESC/POS commands
    const ESC = 0x1B;
    const GS = 0x1D;

    // Helper functions
    const addText = (text: string) => {
      // Sanitize: Only allow safe ASCII (32-126) and Newline (10). 
      // Replace others with '?' to prevent printer errors.
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        if (charCode === 10 || (charCode >= 32 && charCode <= 126)) {
          commands.push(charCode);
        } else {
          commands.push(63); // Print '?' for unknown/unsafe chars
        }
      }
    };

    const addLine = (text: string = '') => {
      addText(text);
      commands.push(0x0A); // LF
    };

    const setAlign = (align: 'left' | 'center' | 'right') => {
      const alignValue = align === 'left' ? 0 : align === 'center' ? 1 : 2;
      commands.push(ESC, 0x61, alignValue);
    };

    const setBold = (enabled: boolean) => {
      commands.push(ESC, 0x45, enabled ? 1 : 0);
    };

    const setSize = (width: number = 1, height: number = 1) => {
      const size = ((width - 1) << 4) | (height - 1);
      commands.push(GS, 0x21, size);
    };

    // Helper to print a line with left and right text (e.g. "Item      Rp 10.000")
    const addRow = (left: string, right: string) => {
      const spaceLen = PRINTER_WIDTH - left.length - right.length;
      if (spaceLen < 1) {
        // If text is too long, print left, then right on next line
        addLine(left);
        const rightSpace = PRINTER_WIDTH - right.length;
        if (rightSpace > 0) {
          addText(' '.repeat(rightSpace));
        }
        addLine(right);
      } else {
        addText(left);
        addText(' '.repeat(spaceLen));
        addLine(right);
      }
    };

    // Helper to center text with padding (for visual centering in monospaced font)
    const addCentered = (text: string) => {
      const words = text.split(' ');
      let currentLine = '';

      words.forEach(word => {
        if ((currentLine + (currentLine ? ' ' : '') + word).length > PRINTER_WIDTH) {
          if (currentLine) {
            const leftPad = Math.max(0, Math.floor((PRINTER_WIDTH - currentLine.length) / 2));
            addText(' '.repeat(leftPad));
            addLine(currentLine);
          }
          currentLine = word;
        } else {
          currentLine += (currentLine ? ' ' : '') + word;
        }
      });

      if (currentLine) {
        const leftPad = Math.max(0, Math.floor((PRINTER_WIDTH - currentLine.length) / 2));
        addText(' '.repeat(leftPad));
        addLine(currentLine);
      }
    };

    // Format date
    const dateStr = data.date instanceof Date
      ? data.date.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      : data.date;

    // Initialize
    commands.push(ESC, 0x40);

    // Header
    setAlign('left');
    setBold(true);
    addCentered(data.storeName);
    setBold(false);

    if (data.storeAddress) {
      addCentered(data.storeAddress);
    }
    addLine('-'.repeat(PRINTER_WIDTH));

    setAlign('left');
    addLine(`No: ${data.transactionId.slice(-8)}`); // Shorten ID for better fit
    addLine(`Tgl: ${dateStr}`);
    addLine('-'.repeat(PRINTER_WIDTH));

    // Items
    for (const item of data.items) {
      const itemTotal = item.total ?? (item.quantity * item.price);
      // Row 1: Item Name
      addLine(item.name);
      // Row 2: Qty x Price ... Total
      // Example: 2 x 5.000         10.000
      const qtyPrice = `${item.quantity} x ${this.formatCurrency(item.price)}`;
      const totalStr = this.formatCurrency(itemTotal);
      addRow(qtyPrice, totalStr);
    }

    addLine('-'.repeat(PRINTER_WIDTH));

    // Totals
    addRow('Subtotal', this.formatCurrency(data.subtotal));

    if (data.tax && data.tax > 0) {
      addRow('Pajak', this.formatCurrency(data.tax));
    }

    setBold(true);
    // Large text for Total
    // Note: GS ! command might reset alignment in some printers, so we handle spaces carefully or just align right
    // Simple approach: standard size bold row
    addRow('TOTAL', this.formatCurrency(data.total));
    setBold(false);

    addLine('-'.repeat(PRINTER_WIDTH));
    addRow('Bayar Tunai', this.formatCurrency(data.payment));
    addRow('Kembali', this.formatCurrency(data.change));

    if (data.paymentMethod) {
      addLine(`Metode: ${data.paymentMethod}`);
    }

    addLine('='.repeat(PRINTER_WIDTH));
    setAlign('center'); // Use center align for footer

    if (data.footerNote) {
      addCentered(data.footerNote);
      addLine();
    }

    addLine('Terima Kasih');
    addLine('Barang yg sudah dibeli');
    addLine('tidak dapat ditukar/dikembalikan');
    addLine();
    addLine();
    addLine();

    // Cut paper
    commands.push(GS, 0x56, 0x00);

    // Convert to Uint8Array and send
    const buffer = new Uint8Array(commands);
    // Reduced chunk size to 100 bytes to prevent buffer overflow on some Android devices/tablets
    const chunkSize = 100;

    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.slice(i, i + chunkSize);
      await this.device.characteristic.writeValue(chunk);
      // Consistent delay for stability
      await new Promise(resolve => setTimeout(resolve, 80));
    }
  }

  async testPrint(): Promise<void> {
    if (!this.device?.characteristic) {
      throw new Error('Printer not connected');
    }

    const ESC = 0x1B;
    const GS = 0x1D;
    const commands: number[] = [];

    // Initialize
    commands.push(ESC, 0x40);

    // Align center
    commands.push(ESC, 0x61, 1);

    // Bold on
    commands.push(ESC, 0x45, 1);

    // Text
    const text1 = 'TEST PRINT';
    for (let i = 0; i < text1.length; i++) {
      commands.push(text1.charCodeAt(i));
    }
    commands.push(0x0A); // LF

    // Bold off
    commands.push(ESC, 0x45, 0);

    // Text
    const text2 = 'Printer berhasil terhubung!';
    for (let i = 0; i < text2.length; i++) {
      commands.push(text2.charCodeAt(i));
    }
    commands.push(0x0A, 0x0A, 0x0A); // 3 LF

    // Cut
    commands.push(GS, 0x56, 0x00);

    const buffer = new Uint8Array(commands);
    await this.device.characteristic.writeValue(buffer);
  }

  private formatCurrency(amount: number): string {
    const formatted = new Intl.NumberFormat('id-ID').format(amount);
    return `Rp${formatted}`;
  }
}

export const bluetoothPrinterService = new BluetoothPrinterService();
