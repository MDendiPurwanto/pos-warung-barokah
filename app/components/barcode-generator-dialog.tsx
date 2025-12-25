import { useState, useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog/dialog";
import { Button } from "./ui/button/button";
import { Label } from "./ui/label/label";
import { Input } from "./ui/input/input";
import { Barcode, Download, RefreshCw } from "lucide-react";
import styles from "./barcode-generator-dialog.module.css";

interface BarcodeGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  onGenerate: (barcode: string) => void;
}

export function BarcodeGeneratorDialog({ open, onOpenChange, productName, onGenerate }: BarcodeGeneratorDialogProps) {
  const [barcodeValue, setBarcodeValue] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate initial barcode when dialog opens
  useEffect(() => {
    if (open && !barcodeValue) {
      generateRandomBarcode();
    }
  }, [open, productName]);

  // Function to generate a valid EAN-13 barcode with checksum
  const generateRandomBarcode = () => {
    // Generate 12 random digits
    let digits = '';
    for (let i = 0; i < 12; i++) {
      digits += Math.floor(Math.random() * 10);
    }
    
    // Calculate EAN-13 checksum
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(digits[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checksum = (10 - (sum % 10)) % 10;
    
    const barcode = digits + checksum;
    setBarcodeValue(barcode);
  };

  // Render barcode on canvas whenever value changes
  useEffect(() => {
    if (barcodeValue && canvasRef.current && open) {
      try {
        const isMobile = window.innerWidth < 640;
        JsBarcode(canvasRef.current, barcodeValue, {
          format: "EAN13",
          width: isMobile ? 1.5 : 2,
          height: isMobile ? 60 : 80,
          displayValue: true,
          fontSize: isMobile ? 12 : 14,
          margin: isMobile ? 5 : 10,
        });
      } catch (error) {
        console.error("Error generating barcode:", error);
      }
    }
  }, [barcodeValue, open]);

  const handleGenerate = () => {
    onGenerate(barcodeValue);
    onOpenChange(false);
  };

  const regenerateBarcode = () => {
    generateRandomBarcode();
  };

  const downloadBarcode = () => {
    if (canvasRef.current && barcodeValue) {
      // Create a new canvas with fixed size for download
      const downloadCanvas = document.createElement("canvas");
      downloadCanvas.width = 400;
      downloadCanvas.height = 200;
      
      try {
        // Generate barcode on the download canvas with optimal settings
        JsBarcode(downloadCanvas, barcodeValue, {
          format: "EAN13",
          width: 2,
          height: 100,
          displayValue: true,
          fontSize: 16,
          margin: 20,
          background: "#ffffff",
          lineColor: "#000000",
        });
        
        // Convert to image and download
        const url = downloadCanvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = `barcode-${barcodeValue}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (error) {
        console.error("Error downloading barcode:", error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialog}>
        <DialogHeader>
          <DialogTitle className={styles.title}>
            <Barcode className={styles.icon} />
            Generate Barcode
          </DialogTitle>
          <DialogDescription>Barcode untuk: {productName}</DialogDescription>
        </DialogHeader>

        <div className={styles.content}>
          <div>
            <Label htmlFor="barcode-input">Nomor Barcode</Label>
            <div className={styles.inputGroup}>
              <Input
                id="barcode-input"
                value={barcodeValue}
                onChange={(e) => setBarcodeValue(e.target.value)}
                placeholder="Masukkan nomor barcode"
                maxLength={13}
              />
              <Button variant="outline" onClick={regenerateBarcode} title="Generate Ulang">
                <RefreshCw style={{ width: 16, height: 16 }} />
                <span className={styles.buttonText}>Generate Ulang</span>
              </Button>
            </div>
          </div>

          <div className={styles.barcodePreview}>
            <canvas ref={canvasRef} />
          </div>

          <p className={styles.hint}>Format: EAN-13 (13 digit)</p>
        </div>

        <DialogFooter>
          <div className={styles.footer}>
            <Button variant="outline" onClick={downloadBarcode}>
              <Download style={{ width: 16, height: 16 }} />
              Unduh Barcode
            </Button>
            <div className={styles.footerRight}>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button onClick={handleGenerate}>Gunakan Barcode Ini</Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
