import { useRef } from "react";
import * as ReactToPrint from "react-to-print";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog/dialog";
import { Button } from "./ui/button/button";
import { Printer } from "lucide-react";
import type { Product } from "~/services/products.service";
import styles from "./print-price-list-dialog.module.css";

// Handle potential default export structure in CJS modules
// @ts-ignore
const useReactToPrint = ReactToPrint.useReactToPrint || ReactToPrint.default?.useReactToPrint || ReactToPrint.default;

interface PrintPriceListDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    products: Product[];
}

export function PrintPriceListDialog({
    open,
    onOpenChange,
    products,
}: PrintPriceListDialogProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef,
        documentTitle: "Daftar Harga - POS Warung Barokah",
    });

    // Sort products by name
    const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={styles.dialogContent}>
                <DialogHeader>
                    <DialogTitle>Cetak Daftar Harga</DialogTitle>
                    <DialogDescription>
                        Pratinjau daftar harga untuk ditempel di warung. Menggunakan kertas A4.
                    </DialogDescription>
                </DialogHeader>

                <div className={styles.previewContainer}>
                    <div ref={contentRef} className={styles.printArea}>
                        {/* Inline styles for print compatibility */}
                        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
                            <div className={styles.header}>
                                <h1 className={styles.storeName}>WARUNG BAROKAH</h1>
                                <h2 className={styles.documentTitle}>DAFTAR HARGA</h2>
                                <div className={styles.date}>
                                    Per Tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            </div>

                            <div className={styles.productList} style={{ columnCount: 2, columnGap: '40px' }}>
                                {sortedProducts.map((product) => (
                                    <div key={product.id} className={styles.productRow} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted #ccc', padding: '5px 0', breakInside: 'avoid' }}>
                                        <span className={styles.productName} style={{ fontWeight: 600 }}>{product.name}</span>
                                        <span className={styles.productPrice} style={{ fontWeight: 800 }}>{formatCurrency(product.price)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.actionButtons}>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button onClick={() => handlePrint()}>
                        <Printer style={{ width: 16, height: 16, marginRight: 8 }} />
                        Cetak
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
