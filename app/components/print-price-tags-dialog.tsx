import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import * as ReactToPrint from "react-to-print";
// Handle potential default export structure in CJS modules
// @ts-ignore
const useReactToPrint = ReactToPrint.useReactToPrint || ReactToPrint.default?.useReactToPrint || ReactToPrint.default;
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

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Tag Harga - POS Warung Barokah",
  });

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

        {/* Scrollable Preview Area */}
        <div className={styles.previewContainer}>
          <div className={styles.tagsGrid}>
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

        {/* Hidden Printable Content (Visible only during print) */}
        <div style={{ display: "none" }}>
          <div ref={contentRef} className={styles.printContainer}>
            <style type="text/css" media="print">
              {`
                @page { size: A4; margin: 10mm; }
                @media print {
                  body { -webkit-print-color-adjust: exact; }
                  .${styles.printContainer} { display: block !important; }
                  .${styles.tagsGrid} {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr) !important;
                    gap: 15px;
                  }
                  .${styles.tag} {
                    break-inside: avoid;
                    page-break-inside: avoid;
                    border: 4px dotted #000 !important;
                    border-radius: 0 !important;
                  }
                }
              `}
            </style>
            <div className={styles.tagsGrid}>
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
        </div>

        <DialogFooter>
          <div className={styles.footer}>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button variant="outline" onClick={() => handlePrint()}>
              <Download style={{ width: 16, height: 16 }} />
              Download PDF
            </Button>
            <Button onClick={() => handlePrint()}>
              <Printer style={{ width: 16, height: 16 }} />
              Cetak
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
