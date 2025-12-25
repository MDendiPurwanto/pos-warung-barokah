import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { ChevronLeft, Receipt, Calendar, Printer } from 'lucide-react';
import * as TransactionService from '../services/transactions.service';
import type { Transaction } from '../services/transactions.service';
import { Button } from '../components/ui/button/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table/table';
import { toast } from 'sonner';
import { BluetoothPrinterDialog } from '../components/bluetooth-printer-dialog';
import { bluetoothPrinterService } from '../lib/bluetooth-printer';
import type { ReceiptData } from '../lib/bluetooth-printer';
import styles from './riwayat-penjualan-detail.module.css';

export default function RiwayatPenjualanDetail() {
  const { id } = useParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPrinterDialog, setShowPrinterDialog] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (id) {
      loadTransaction(id);
    }
  }, [id]);

  const loadTransaction = async (transactionId: string) => {
    try {
      setIsLoading(true);
      const data = await TransactionService.getTransaction(transactionId);
      setTransaction(data);
    } catch (error) {
      toast.error("Gagal Memuat Transaksi", {
        description: "Terjadi kesalahan saat memuat detail transaksi",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const handlePrint = async () => {
    if (!transaction) return;

    // Check if printer is already connected
    if (!bluetoothPrinterService.isConnected()) {
      setShowPrinterDialog(true);
      return;
    }

    await printReceipt();
  };

  const printReceipt = async () => {
    if (!transaction) return;

    setIsPrinting(true);
    try {
      const receiptData: ReceiptData = {
        storeName: 'TOKO SAYA',
        storeAddress: 'Jl. Contoh No. 123, Jakarta',
        transactionId: transaction.id,
        date: formatDateTime(transaction.date),
        items: transaction.items.map(item => ({
          name: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        subtotal: transaction.total,
        total: transaction.total,
        payment: transaction.total,
        change: 0,
        paymentMethod: 'Tunai'
      };

      await bluetoothPrinterService.printReceipt(receiptData);
      
      toast.success("Struk Berhasil Dicetak", {
        description: "Struk transaksi telah dicetak",
      });
    } catch (error) {
      toast.error("Gagal Mencetak Struk", {
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrinterConnected = () => {
    setShowPrinterDialog(false);
    printReceipt();
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <Link to="/riwayat-penjualan">
            <Button variant="outline" size="icon">
              <ChevronLeft />
            </Button>
          </Link>
          <h1 className={styles.title}>Detail Transaksi</h1>
        </header>
        <div className={styles.content}>
          <Card>
            <CardContent className={styles.notFound}>
              <p>Memuat transaksi...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <Link to="/riwayat-penjualan">
            <Button variant="outline" size="icon">
              <ChevronLeft />
            </Button>
          </Link>
          <h1 className={styles.title}>Detail Transaksi</h1>
        </header>
        <div className={styles.content}>
          <Card>
            <CardContent className={styles.notFound}>
              <p>Transaksi tidak ditemukan</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/riwayat-penjualan">
            <Button variant="outline" size="icon">
              <ChevronLeft />
            </Button>
          </Link>
          <h1 className={styles.title}>Detail Transaksi</h1>
        </div>
        <Button 
          onClick={handlePrint}
          disabled={isPrinting}
          variant="default"
          className={styles.printButton}
        >
          <Printer />
          {isPrinting ? 'Mencetak...' : 'Cetak Struk'}
        </Button>
      </header>

      <div className={styles.content}>
        <Card className={styles.infoCard}>
          <CardHeader>
            <div className={styles.transactionHeader}>
              <Receipt className={styles.receiptIcon} />
              <div>
                <CardTitle className={styles.transactionId}>
                  {transaction.id}
                </CardTitle>
                <div className={styles.transactionDate}>
                  <Calendar size={14} />
                  <span>{formatDateTime(transaction.date)}</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className={styles.itemsCard}>
          <CardHeader>
            <CardTitle>Daftar Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.tableWrapper}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className={styles.rightAlign}>Harga</TableHead>
                    <TableHead className={styles.centerAlign}>Jumlah</TableHead>
                    <TableHead className={styles.rightAlign}>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaction.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className={styles.productName}>
                        {item.productName}
                      </TableCell>
                      <TableCell className={styles.rightAlign}>
                        {formatCurrency(item.price)}
                      </TableCell>
                      <TableCell className={styles.centerAlign}>
                        {item.quantity}
                      </TableCell>
                      <TableCell className={styles.rightAlign}>
                        {formatCurrency(item.price * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className={styles.summaryCard}>
          <CardContent className={styles.summaryContent}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Total Belanja:</span>
              <span className={styles.summaryValue}>
                {formatCurrency(transaction.total)}
              </span>
            </div>

          </CardContent>
        </Card>
      </div>

      <BluetoothPrinterDialog
        open={showPrinterDialog}
        onOpenChange={setShowPrinterDialog}
        onConnected={handlePrinterConnected}
      />
    </div>
  );
}
