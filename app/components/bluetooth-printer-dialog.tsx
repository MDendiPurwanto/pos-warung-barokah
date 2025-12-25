import { useState } from 'react';
import { Bluetooth, Printer, Wifi } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog/dialog';
import { Button } from './ui/button/button';
import { bluetoothPrinterService } from '~/lib/bluetooth-printer';
import styles from './bluetooth-printer-dialog.module.css';

interface BluetoothPrinterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}

export function BluetoothPrinterDialog({
  open,
  onOpenChange,
  onConnected
}: BluetoothPrinterDialogProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');

    try {
      const device = await bluetoothPrinterService.connect();
      setIsConnected(true);
      setDeviceName(device.device.name || 'Unknown Device');
      onConnected?.();
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('User cancelled')) {
          setError('Koneksi dibatalkan');
        } else {
          setError('Gagal terhubung ke printer: ' + err.message);
        }
      } else {
        setError('Gagal terhubung ke printer');
      }
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await bluetoothPrinterService.disconnect();
    setIsConnected(false);
    setDeviceName('');
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    setError('');

    try {
      await bluetoothPrinterService.testPrint();
    } catch (err) {
      setError('Gagal mencetak test: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsTesting(false);
    }
  };

  const checkBluetoothSupport = () => {
    return 'bluetooth' in navigator;
  };

  if (!checkBluetoothSupport()) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bluetooth Tidak Didukung</DialogTitle>
            <DialogDescription>
              Browser Anda tidak mendukung Web Bluetooth API. Silakan gunakan browser yang mendukung seperti Chrome, Edge, atau Opera.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle className={styles.dialogTitle}>
            <Printer className={styles.icon} />
            Printer Bluetooth
          </DialogTitle>
          <DialogDescription>
            Hubungkan aplikasi dengan printer thermal Bluetooth untuk mencetak struk
          </DialogDescription>
        </DialogHeader>

        <div className={styles.content}>
          {!isConnected ? (
            <div className={styles.connectSection}>
              <div className={styles.illustration}>
                <Bluetooth className={styles.bluetoothIcon} />
              </div>
              <p className={styles.instruction}>
                Pastikan printer Bluetooth Anda sudah menyala dan dalam mode pairing
              </p>
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                size="lg"
                className={styles.connectButton}
              >
                {isConnecting ? (
                  <>
                    <Wifi className={styles.spinningIcon} />
                    Mencari Printer...
                  </>
                ) : (
                  <>
                    <Bluetooth />
                    Hubungkan Printer
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className={styles.connectedSection}>
              <div className={styles.statusCard}>
                <div className={styles.statusIndicator}>
                  <div className={styles.statusDot} />
                  <span>Terhubung</span>
                </div>
                <div className={styles.deviceInfo}>
                  <Printer className={styles.deviceIcon} />
                  <div>
                    <div className={styles.deviceName}>{deviceName}</div>
                    <div className={styles.deviceStatus}>Siap mencetak</div>
                  </div>
                </div>
              </div>

              <div className={styles.actions}>
                <Button
                  onClick={handleTestPrint}
                  disabled={isTesting}
                  variant="outline"
                  className={styles.testButton}
                >
                  {isTesting ? 'Mencetak...' : 'Test Print'}
                </Button>
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className={styles.disconnectButton}
                >
                  Putuskan Koneksi
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
