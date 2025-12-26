import { useEffect, useRef, useState } from "react";
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [barcodeData, setBarcodeData] = useState<Record<string, string>>({});

  // Generate barcode data URLs when dialog opens
  useEffect(() => {
    if (open) {
      const newBarcodeData: Record<string, string> = {};

      products.forEach((product) => {
        if (product.barcode) {
          try {
            const canvas = document.createElement('canvas');
            JsBarcode(canvas, product.barcode, {
              format: "EAN13",
              width: 2,
              height: 60,
              displayValue: true,
              fontSize: 12,
              margin: 5,
            });
            newBarcodeData[product.id] = canvas.toDataURL();
          } catch (error) {
            console.error(`Error generating barcode for ${product.name}:`, error);
          }
        }
      });

      setBarcodeData(newBarcodeData);
    }
  }, [open, products]);

  const handlePrint = () => {
    if (!contentRef.current) return;

    // Create a new window for printing to ensure isolation and correct rendering
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert("Please allow popups to print");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Tag Harga - POS Warung Barokah</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { 
              font-family: Arial, sans-serif; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact;
              margin: 0;
              padding: 20px;
            }
            .tags-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
            }
            .tag {
              border: 4px dotted #000;
              padding: 10px;
              text-align: center;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              break-inside: avoid;
              page-break-inside: avoid;
              min-height: 200px;
            }
            .tag-store {
              font-size: 14px;
              font-weight: 700;
              color: #000;
              margin-bottom: 10px;
              padding-bottom: 5px;
              border-bottom: 2px solid #000;
              width: 80%;
              margin-left: auto;
              margin-right: auto;
            }
            .tag-name {
              font-size: 18px;
              font-weight: 800;
              color: #000;
              margin-bottom: 5px;
              line-height: 1.2;
              flex-grow: 1;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .tag-price {
              font-size: 32px;
              font-weight: 900;
              color: #000;
              margin: 10px 0;
              letter-spacing: -1px;
            }
            .tag-barcode {
              display: flex;
              justify-content: center;
              margin-top: 5px;
            }
            .tag-barcode img {
              max-width: 100%;
              height: auto;
            }
            .no-barcode {
              font-size: 12px;
              color: #666;
              font-style: italic;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="tags-grid">
            ${products.map(product => `
              <div class="tag">
                <div class="tag-store">Toko Kori Barokah</div>
                <div class="tag-name">${product.name}</div>
                <div class="tag-price">Rp ${product.price.toLocaleString("id-ID")}</div>
                ${product.barcode && barcodeData[product.id] ? `
                  <div class="tag-barcode">
                    <img src="${barcodeData[product.id]}" alt="Barcode" />
                  </div>
                ` : `
                  <div class="no-barcode">Tidak ada barcode</div>
                `}
              </div>
            `).join('')}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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

        {/* Preview Area (Visible on Screen) */}
        <div className={styles.previewContainer}>
          <div className={styles.tagsGrid} ref={contentRef}>
            {products.map((product) => (
              <div key={product.id} className={styles.tag}>
                <div className={styles.tagStore}>Toko Kori Barokah</div>
                <div className={styles.tagName}>{product.name}</div>
                <div className={styles.tagPrice}>{formatCurrency(product.price)}</div>
                {product.barcode && barcodeData[product.id] ? (
                  <div className={styles.tagBarcode}>
                    <img src={barcodeData[product.id]} alt="Barcode" />
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
            <Button variant="outline" onClick={handlePrint}>
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
