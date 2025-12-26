import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, Receipt, Calendar, DollarSign } from 'lucide-react';
import * as TransactionService from '../services/transactions.service';
import type { Transaction } from '../services/transactions.service';
import { Button } from '../components/ui/button/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card/card';
import { toast } from 'sonner';
import styles from './riwayat-penjualan.module.css';

export default function RiwayatPenjualan() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const data = await TransactionService.getTransactions();
      setTransactions(data);
    } catch (error) {
      toast.error("Gagal Memuat Transaksi", {
        description: "Terjadi kesalahan saat memuat data transaksi",
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/">
          <Button variant="outline" size="icon">
            <ChevronLeft />
          </Button>
        </Link>
        <h1 className={styles.title}>Riwayat Penjualan</h1>
      </header>

      <div className={styles.statsGrid}>
        <Card>
          <CardContent className={styles.statContent}>
            <div className={styles.statIconWrapper} style={{ backgroundColor: 'var(--color-emerald-3)' }}>
              <DollarSign size={24} color="var(--color-emerald-11)" />
            </div>
            <div>
              <p className={styles.statLabel}>Total Keuntungan</p>
              <p className={styles.statValue} style={{ color: 'var(--color-emerald-11)' }}>
                {formatCurrency(transactions.reduce((sum, t) => sum + (t.profit || 0), 0))}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={styles.statContent}>
            <div className={styles.statIconWrapper} style={{ backgroundColor: 'var(--color-blue-3)' }}>
              <Receipt size={24} color="var(--color-blue-11)" />
            </div>
            <div>
              <p className={styles.statLabel}>Total Penjualan</p>
              <p className={styles.statValue}>
                {formatCurrency(transactions.reduce((sum, t) => sum + t.total, 0))}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={styles.statContent}>
            <div className={styles.statIconWrapper} style={{ backgroundColor: 'var(--color-orange-3)' }}>
              <Calendar size={24} color="var(--color-orange-11)" />
            </div>
            <div>
              <p className={styles.statLabel}>Total Item Terjual</p>
              <p className={styles.statValue}>
                {transactions.reduce((sum, t) => sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={styles.content}>
        {transactions.length === 0 ? (
          <Card className={styles.emptyState}>
            <CardContent className={styles.emptyContent}>
              <Receipt size={64} className={styles.emptyIcon} />
              <h2>Belum Ada Transaksi</h2>
              <p>Transaksi penjualan akan muncul di sini</p>
            </CardContent>
          </Card>
        ) : (
          <div className={styles.transactionList}>
            {transactions.map((transaction) => (
              <Link
                key={transaction.id}
                to={`/riwayat-penjualan/${transaction.id}`}
                className={styles.transactionLink}
              >
                <Card className={styles.transactionCard}>
                  <CardHeader className={styles.cardHeader}>
                    <div className={styles.transactionInfo}>
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
                  <CardContent className={styles.cardContent}>
                    <div className={styles.transactionTotal}>
                      <DollarSign size={16} />
                      <span className={styles.totalAmount}>
                        {formatCurrency(transaction.total)}
                      </span>
                    </div>
                    <div className={styles.itemCount}>
                      {transaction.items.length} item
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
