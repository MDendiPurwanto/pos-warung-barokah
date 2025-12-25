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
  private readonly SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
  private readonly CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb';

  async connect(): Promise<PrinterDevice> {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth API is not available in this browser');
      }

      // Request Bluetooth device
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [this.SERVICE_UUID] },
          { namePrefix: 'RPP' },
          { namePrefix: 'BlueTooth Printer' },
          { namePrefix: 'Printer' }
        ],
        optionalServices: [this.SERVICE_UUID]
      });

      // Connect to GATT server
      const server = await device.gatt?.connect();
      if (!server) throw new Error('Failed to connect to GATT server');

      // Get service
      const service = await server.getPrimaryService(this.SERVICE_UUID);
      
      // Get characteristic
      const characteristic = await service.getCharacteristic(this.CHARACTERISTIC_UUID);

      this.device = {
        device,
        server,
        service,
        characteristic
      };

      return this.device;
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
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
    
    // ESC/POS commands
    const ESC = 0x1B;
    const GS = 0x1D;
    
    // Helper functions
    const addText = (text: string) => {
      for (let i = 0; i < text.length; i++) {
        commands.push(text.charCodeAt(i));
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
    
    // Format date
    const dateStr = data.date instanceof Date 
      ? data.date.toLocaleString('id-ID', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : data.date;
    
    // Initialize
    commands.push(ESC, 0x40);
    
    // Header
    setAlign('center');
    setBold(true);
    setSize(2, 2);
    addLine(data.storeName);
    setBold(false);
    setSize(1, 1);
    if (data.storeAddress) {
      addLine(data.storeAddress);
    }
    addLine('================================');
    
    setAlign('left');
    addLine(`No: ${data.transactionId}`);
    addLine(`Tanggal: ${dateStr}`);
    addLine('================================');
    addLine();
    
    // Items
    for (const item of data.items) {
      const itemTotal = item.total ?? (item.quantity * item.price);
      addLine(item.name);
      addLine(`  ${item.quantity} x ${this.formatCurrency(item.price)} = ${this.formatCurrency(itemTotal)}`);
    }
    
    addLine('================================');
    addLine(`Subtotal: ${this.formatCurrency(data.subtotal)}`);
    
    if (data.tax) {
      addLine(`Pajak: ${this.formatCurrency(data.tax)}`);
    }
    
    setBold(true);
    addLine(`TOTAL: ${this.formatCurrency(data.total)}`);
    setBold(false);
    addLine('--------------------------------');
    addLine(`Bayar: ${this.formatCurrency(data.payment)}`);
    
    if (data.change > 0) {
      addLine(`Kembali: ${this.formatCurrency(data.change)}`);
    }
    
    if (data.paymentMethod) {
      addLine(`Metode: ${data.paymentMethod}`);
    }
    
    addLine('================================');
    setAlign('center');
    addLine('Terima Kasih');
    addLine('Selamat Berbelanja Kembali');
    addLine();
    addLine();
    addLine();
    
    // Cut paper
    commands.push(GS, 0x56, 0x00);
    
    // Convert to Uint8Array and send
    const buffer = new Uint8Array(commands);
    const chunkSize = 512;
    
    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.slice(i, i + chunkSize);
      await this.device.characteristic.writeValue(chunk);
      await new Promise(resolve => setTimeout(resolve, 100));
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
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }
}

export const bluetoothPrinterService = new BluetoothPrinterService();
