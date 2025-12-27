import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { ChevronLeft, Receipt, Calendar, Printer } from 'lucide-react';
import * as TransactionService from '../services/transactions.service';
import type { Transaction } from '../services/transactions.service';
import { Button } from '../components/ui/button/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card/card';
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

    // Auto-reconnect printer if needed
    if (!bluetoothPrinterService.isConnected()) {
      bluetoothPrinterService.tryAutoConnect().then(connected => {
        if (connected) {
          toast.success("Printer Terhubung Kembali");
        }
      });
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
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const handlePrint = async () => {
    if (!transaction) return;

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
        storeName: 'TOKO BAROKAH',
        storeAddress: 'Jl. Gunung Galunggung, RT.02/RW.07, Blubuk, Blukbuk, Kec. Dukuhwaru, Kabupaten Tegal, Jawa Tengah 52451',
        footerNote: 'sedia Wifi Voucheran, Transfer max 500k, bayar top up listrik dan Sembako',
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
              <ChevronLeft size={24} />
            </Button>
          </Link>
          <h1 className={styles.title}>Detail Transaksi</h1>
        </header>
        <div className={styles.content}>
          <p className={styles.loadingText}>Memuat...</p>
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
              <ChevronLeft size={24} />
            </Button>
          </Link>
          <h1 className={styles.title}>Detail Transaksi</h1>
        </header>
        <div className={styles.content}>
          <p className={styles.notFound}>Transaksi tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/riwayat-penjualan">
          <Button variant="outline" size="icon" className={styles.backButton}>
            <ChevronLeft size={28} />
          </Button>
        </Link>
        <h1 className={styles.title}>Detail Transaksi</h1>
      </header>

      <div className={styles.content}>
        {/* Transaction Header Card */}
        <Card className={styles.infoCard}>
          <CardContent className={styles.infoContent}>
            <div className={styles.dateInfo}>
              <Calendar size={20} className={styles.iconDim} />
              <span>{formatDateTime(transaction.date)}</span>
            </div>
            <div className={styles.idInfo}>
              <Receipt size={20} className={styles.iconDim} />
              <span>ID: {transaction.id}</span>
            </div>
          </CardContent>
        </Card>

        {/* Item List */}
        <div className={styles.itemsList}>
          <h2 className={styles.sectionTitle}>Daftar Belanja</h2>
          {transaction.items.map((item, index) => (
            <Card key={index} className={styles.itemCard}>
              <CardContent className={styles.itemContent}>
                <div className={styles.itemMain}>
                  <span className={styles.itemName}>{item.productName}</span>
                  <span className={styles.itemPriceSingle}>{item.quantity} x {formatCurrency(item.price)}</span>
                </div>
                <div className={styles.itemTotal}>
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Card */}
        <Card className={styles.summaryCard}>
          <CardContent className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Total Harga</span>
            <span className={styles.summaryValue}>
              {formatCurrency(transaction.total)}
            </span>
          </CardContent>
        </Card>

        {/* Floating/Fixed Print Button Area */}
        <div className={styles.actionArea}>
          <Button
            onClick={handlePrint}
            disabled={isPrinting}
            size="lg"
            className={styles.printButton}
          >
            <Printer size={24} />
            {isPrinting ? 'Mencetak...' : 'Cetak Struk'}
          </Button>
        </div>
      </div>

      <BluetoothPrinterDialog
        open={showPrinterDialog}
        onOpenChange={setShowPrinterDialog}
        onConnected={handlePrinterConnected}
      />
    </div>
  );
}
