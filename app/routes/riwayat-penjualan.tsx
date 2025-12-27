import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, Receipt, Calendar, DollarSign } from 'lucide-react';
import * as TransactionService from '../services/transactions.service';
import type { Transaction } from '../services/transactions.service';
import { Button } from '../components/ui/button/button';
import { Input } from '../components/ui/input/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card/card';
import { toast } from 'sonner';
import styles from './riwayat-penjualan.module.css';

export default function RiwayatPenjualan() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const filtered = transactions.filter(t => {
        const tDate = new Date(t.date);
        const sDate = new Date(selectedDate);
        return tDate.getDate() === sDate.getDate() &&
          tDate.getMonth() === sDate.getMonth() &&
          tDate.getFullYear() === sDate.getFullYear();
      });
      setFilteredTransactions(filtered);
    } else {
      setFilteredTransactions(transactions);
    }
  }, [selectedDate, transactions]);

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
            <div className={styles.statIconWrapper} style={{ backgroundColor: 'var(--color-blue-3)' }}>
              <Receipt size={24} color="var(--color-blue-11)" />
            </div>
            <div>
              <p className={styles.statLabel}>
                {selectedDate
                  ? `Penjualan ${new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`
                  : 'Penjualan Hari Ini'}
              </p>
              <p className={styles.statValue}>
                {selectedDate ? (
                  formatCurrency(filteredTransactions.reduce((sum, t) => sum + t.total, 0))
                ) : (
                  formatCurrency(transactions.reduce((sum, t) => {
                    const tDate = new Date(t.date);
                    const today = new Date();
                    const isToday = tDate.getDate() === today.getDate() &&
                      tDate.getMonth() === today.getMonth() &&
                      tDate.getFullYear() === today.getFullYear();
                    return sum + (isToday ? t.total : 0);
                  }, 0))
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={styles.statContent}>
            <div className={styles.statIconWrapper} style={{ backgroundColor: 'var(--color-violet-3)' }}>
              <Receipt size={24} color="var(--color-violet-11)" />
            </div>
            <div>
              <p className={styles.statLabel}>Penjualan Minggu Ini</p>
              <p className={styles.statValue}>
                {formatCurrency(transactions.reduce((sum, t) => {
                  const tDate = new Date(t.date);
                  const today = new Date();
                  const firstDayOfWeek = new Date(today);
                  const day = firstDayOfWeek.getDay() || 7; // Sunday is 0, make it 7
                  firstDayOfWeek.setHours(0, 0, 0, 0);
                  firstDayOfWeek.setDate(today.getDate() - day + 1); // Monday as start

                  const isThisWeek = tDate >= firstDayOfWeek;
                  return sum + (isThisWeek ? t.total : 0);
                }, 0))}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={styles.statContent}>
            <div className={styles.statIconWrapper} style={{ backgroundColor: 'var(--color-indigo-3)' }}>
              <Receipt size={24} color="var(--color-indigo-11)" />
            </div>
            <div>
              <p className={styles.statLabel}>Penjualan Bulan Ini</p>
              <p className={styles.statValue}>
                {formatCurrency(transactions.reduce((sum, t) => {
                  const tDate = new Date(t.date);
                  const today = new Date();
                  const isThisMonth = tDate.getMonth() === today.getMonth() &&
                    tDate.getFullYear() === today.getFullYear();
                  return sum + (isThisMonth ? t.total : 0);
                }, 0))}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={styles.statContent}>
            <div className={styles.statIconWrapper} style={{ backgroundColor: 'var(--color-emerald-3)' }}>
              <DollarSign size={24} color="var(--color-emerald-11)" />
            </div>
            <div>
              <p className={styles.statLabel}>Total Keuntungan</p>
              <p className={styles.statValue} style={{ color: 'var(--color-emerald-11)' }}>
                {formatCurrency(filteredTransactions.reduce((sum, t) => sum + (t.profit || 0), 0))}
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
                {filteredTransactions.reduce((sum, t) => sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={styles.content}>
        <div className={styles.filterSection}>
          <div className={styles.dateFilter}>
            <span className={styles.filterLabel}>Filter Tanggal:</span>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={styles.dateInput}
            />
            {selectedDate && (
              <Button
                variant="outline"
                onClick={() => setSelectedDate("")}
                size="sm"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <Card className={styles.emptyState}>
            <CardContent className={styles.emptyContent}>
              <Receipt size={64} className={styles.emptyIcon} />
              <h2>Belum Ada Transaksi</h2>
              <p>Transaksi penjualan akan muncul di sini</p>
            </CardContent>
          </Card>
        ) : (
          <div className={styles.transactionList}>
            {filteredTransactions.map((transaction) => (
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
