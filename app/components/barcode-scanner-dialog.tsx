import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog/dialog";
import { Button } from "./ui/button/button";
import { ScanBarcode, X } from "lucide-react";
import styles from "./barcode-scanner-dialog.module.css";

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScannerDialog({ open, onOpenChange, onScan }: BarcodeScannerDialogProps) {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerDivId = "barcode-scanner-container";

  useEffect(() => {
    if (open && !scannerRef.current) {
      // Wait for DOM to be ready
      const initializeScanner = () => {
        const element = document.getElementById(scannerDivId);
        if (!element) {
          console.error('Scanner container not found');
          return;
        }

        try {
          // Initialize scanner
          const scanner = new Html5QrcodeScanner(
            scannerDivId,
            {
              fps: 10,
              qrbox: { width: 250, height: 150 },
              supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
              rememberLastUsedCamera: true,
            },
            false
          );

          scanner.render(
            (decodedText) => {
              // Success callback
              onScan(decodedText);
              cleanup();
              onOpenChange(false);
            },
            (errorMessage) => {
              // Error callback - can be ignored for continuous scanning
            }
          );

          scannerRef.current = scanner;
          setScanning(true);
        } catch (error) {
          console.error('Error initializing scanner:', error);
        }
      };

      // Delay initialization to ensure DOM is ready
      setTimeout(initializeScanner, 100);
    }

    return () => {
      cleanup();
    };
  }, [open]);

  const cleanup = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (error) {
        console.error("Error clearing scanner:", error);
      }
      scannerRef.current = null;
      setScanning(false);
    }
  };

  const handleClose = () => {
    cleanup();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={styles.dialog}>
        <DialogHeader>
          <DialogTitle className={styles.title}>
            <ScanBarcode className={styles.icon} />
            Scan Barcode Produk
          </DialogTitle>
          <DialogDescription>Arahkan kamera ke barcode produk</DialogDescription>
        </DialogHeader>

        <div className={styles.scannerWrapper}>
          <div id={scannerDivId} className={styles.scanner}></div>
        </div>

        <div className={styles.footer}>
          <Button variant="outline" onClick={handleClose}>
            <X style={{ width: 16, height: 16 }} />
            Batal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
