import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog/dialog";
import { Button } from "./ui/button/button";
import { Printer, Download } from "lucide-react";
import type { Product } from "~/services/products.service";
import styles from "./print-price-tags-dialog.module.css";

interface PrintPriceTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
}

export function PrintPriceTagsDialog({ open, onOpenChange, products }: PrintPriceTagsDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Generate barcodes when dialog opens
  useEffect(() => {
    if (open && printRef.current) {
      const canvases = printRef.current.querySelectorAll("canvas");
      canvases.forEach((canvas, index) => {
        const product = products[index];
        if (product?.barcode) {
          try {
            JsBarcode(canvas, product.barcode, {
              format: "EAN13",
              width: 2,
              height: 60,
              displayValue: true,
              fontSize: 12,
              margin: 5,
            });
          } catch (error) {
            console.error(`Error generating barcode for ${product.name}:`, error);
          }
        }
      });
    }
  }, [open, products]);

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Cetak Tag Harga</title>
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                
                body {
                  font-family: Arial, sans-serif;
                  padding: 20px;
                }
                
                .tags-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 20px;
                  page-break-inside: avoid;
                }
                
                .tag {
                  border: 2px dashed #333;
                  padding: 15px;
                  text-align: center;
                  page-break-inside: avoid;
                  background: white;
                }
                
                .tag-store {
                  font-size: 14px;
                  font-weight: 600;
                  color: #333;
                  margin-bottom: 10px;
                  border-bottom: 1px solid #ddd;
                  padding-bottom: 8px;
                }
                
                .tag-name {
                  font-size: 16px;
                  font-weight: bold;
                  margin-bottom: 8px;
                  min-height: 40px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }
                
                .tag-price {
                  font-size: 24px;
                  font-weight: bold;
                  color: #000;
                  margin: 10px 0;
                }
                
                .tag-barcode {
                  margin-top: 10px;
                  display: flex;
                  justify-content: center;
                }
                
                .tag-barcode canvas {
                  max-width: 100%;
                  height: auto;
                }
                
                .no-barcode {
                  font-size: 12px;
                  color: #999;
                  font-style: italic;
                  padding: 10px 0;
                }
                
                @media print {
                  body {
                    padding: 10px;
                  }
                  
                  .tags-grid {
                    gap: 15px;
                  }
                  
                  .tag {
                    border: 1px solid #333;
                    break-inside: avoid;
                  }
                }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        
        // Wait for images/barcodes to load before printing
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    }
  };

  const handleDownloadPDF = () => {
    // For now, just trigger print which allows save as PDF
    handlePrint();
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialog}>
        <DialogHeader>
          <DialogTitle className={styles.title}>
            <Printer className={styles.icon} />
            Cetak Tag Harga
          </DialogTitle>
          <DialogDescription>
            {products.length} produk siap dicetak
          </DialogDescription>
        </DialogHeader>

        <div className={styles.previewContainer}>
          <div ref={printRef} className={styles.tagsGrid}>
            {products.map((product) => (
              <div key={product.id} className={styles.tag}>
                <div className={styles.tagStore}>Toko Kori Barokah</div>
                <div className={styles.tagName}>{product.name}</div>
                <div className={styles.tagPrice}>{formatCurrency(product.price)}</div>
                {product.barcode ? (
                  <div className={styles.tagBarcode}>
                    <canvas />
                  </div>
                ) : (
                  <div className={styles.noBarcode}>Tidak ada barcode</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <div className={styles.footer}>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download style={{ width: 16, height: 16 }} />
              Download PDF
            </Button>
            <Button onClick={handlePrint}>
              <Printer style={{ width: 16, height: 16 }} />
              Cetak
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
