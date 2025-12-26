import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog/dialog";
import { Button } from "./ui/button/button";
import { Printer } from "lucide-react";
import type { Product } from "~/services/products.service";
import styles from "./print-price-list-dialog.module.css";

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
    // Sort products by name
    const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            alert("Please allow popups to print");
            return;
        }

        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Daftar Harga - POS Warung Barokah</title>
                <style>
                    @page { size: A4; margin: 15mm; }
                    body {
                        font-family: Arial, sans-serif;
                        color: #000;
                        margin: 0;
                        padding: 20px;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 3px double #000;
                        padding-bottom: 10px;
                    }
                    .store-name {
                        font-size: 24px;
                        font-weight: 900;
                        margin: 0;
                        text-transform: uppercase;
                    }
                    .document-title {
                        font-size: 18px;
                        font-weight: bold;
                        margin: 5px 0 0 0;
                    }
                    .date {
                        font-size: 12px;
                        color: #555;
                        margin-top: 5px;
                        text-align: right;
                    }
                    .product-list {
                        column-count: 2;
                        column-gap: 40px;
                        column-rule: 1px solid #ddd;
                        width: 100%;
                    }
                    .product-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: baseline;
                        padding: 6px 0;
                        border-bottom: 1px dotted #ccc;
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                    .product-name {
                        font-size: 14px;
                        font-weight: 600;
                        flex: 1;
                        padding-right: 15px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .product-price {
                        font-size: 15px;
                        font-weight: 800;
                        white-space: nowrap;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 class="store-name">WARUNG BAROKAH</h1>
                    <h2 class="document-title">DAFTAR HARGA</h2>
                    <div class="date">Per Tanggal: ${dateStr}</div>
                </div>
                <div class="product-list">
                    ${sortedProducts.map(product => `
                        <div class="product-row">
                            <span class="product-name">${product.name}</span>
                            <span class="product-price">${formatCurrency(product.price)}</span>
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
                    <div className={styles.printArea}>
                        {/* Inline styles only for preview visibility, print uses handlePrint HTML */}
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
                    <Button onClick={handlePrint}>
                        <Printer style={{ width: 16, height: 16, marginRight: 8 }} />
                        Cetak
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
