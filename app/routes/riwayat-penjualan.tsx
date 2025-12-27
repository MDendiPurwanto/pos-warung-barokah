import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, Receipt, Calendar } from 'lucide-react';
import * as TransactionService from '../services/transactions.service';
import type { Transaction } from '../services/transactions.service';
import { Button } from '../components/ui/button/button';
import { Input } from '../components/ui/input/input';
import { Card, CardContent } from '../components/ui/card/card';
import { toast } from 'sonner';
import styles from './riwayat-penjualan.module.css';

export default function RiwayatPenjualan() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  // Filter Logic
  useEffect(() => {
    if (!transactions.length) return;

    let filtered = [...transactions];

    if (selectedDate) {
      // If a specific date is chosen, filter by that date (overrides tabs)
      const sDate = new Date(selectedDate);
      filtered = filtered.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getDate() === sDate.getDate() &&
          tDate.getMonth() === sDate.getMonth() &&
          tDate.getFullYear() === sDate.getFullYear();
      });
    } else {
      // Apply Tab filters
      const today = new Date();

      if (activeTab === 'today') {
        filtered = filtered.filter(t => {
          const tDate = new Date(t.date);
          return tDate.getDate() === today.getDate() &&
            tDate.getMonth() === today.getMonth() &&
            tDate.getFullYear() === today.getFullYear();
        });
      } else if (activeTab === 'week') {
        // "This Week" (Monday to Sunday)
        const d = new Date(today);
        const dayOfWeek = d.getDay() || 7; // Sunday is 7, Monday is 1
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - dayOfWeek + 1); // Set to Monday of this week

        filtered = filtered.filter(t => new Date(t.date) >= d);
      } else if (activeTab === 'month') {
        filtered = filtered.filter(t => {
          const tDate = new Date(t.date);
          return tDate.getMonth() === today.getMonth() &&
            tDate.getFullYear() === today.getFullYear();
        });
      }
      // 'all' = no filter
    }

    // Sort by date desc (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredTransactions(filtered);
  }, [selectedDate, transactions, activeTab]);

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

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  // Calculate Stats dynamically based on the current VIEW (Filtered Data)
  const calculateStats = () => {
    const total = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
    const count = filteredTransactions.length;
    return { total, count };
  };

  const { total: currentTotal, count: currentCount } = calculateStats();

  const getPeriodLabel = () => {
    if (selectedDate) return "Tanggal Terpilih";
    switch (activeTab) {
      case 'today': return "Hari Ini";
      case 'week': return "Minggu Ini";
      case 'month': return "Bulan Ini";
      case 'all': return "Semua";
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link to="/">
          <Button variant="outline" size="icon" className={styles.backButton}>
            <ChevronLeft size={28} />
          </Button>
        </Link>
        <h1 className={styles.title}>Riwayat Penjualan</h1>
      </header>

      {/* Tabs Section */}
      <div className={styles.tabsContainer}>
        {(['today', 'week', 'month', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSelectedDate(""); // Clear date filter when clicking tabs
            }}
            className={`${styles.tabButton} ${activeTab === tab && !selectedDate ? styles.activeTab : ''}`}
          >
            {tab === 'today' && 'Hari Ini'}
            {tab === 'week' && 'Minggu Ini'}
            {tab === 'month' && 'Bulan Ini'}
            {tab === 'all' && 'Semua'}
          </button>
        ))}
      </div>

      <div className={styles.statsGrid}>
        {/* BIG CARD 1: Sales */}
        <Card className={styles.highlightCard}>
          <CardContent className={styles.statContent}>
            <div className={styles.statIconWrapper} style={{ backgroundColor: 'var(--color-blue-3)' }}>
              <Receipt size={32} color="var(--color-blue-11)" />
            </div>
            <div>
              <p className={styles.statLabel}>Penjualan {getPeriodLabel()}</p>
              <p className={styles.statValue}>
                {formatCurrency(currentTotal)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* BIG CARD 2: Total Transactions */}
        <Card>
          <CardContent className={styles.statContent}>
            <div className={styles.statIconWrapper} style={{ backgroundColor: 'var(--color-orange-3)' }}>
              <Calendar size={32} color="var(--color-orange-11)" />
            </div>
            <div>
              <p className={styles.statLabel}>Transaksi {getPeriodLabel()}</p>
              <p className={styles.statValue}>
                {currentCount} Transaksi
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={styles.content}>
        <div className={styles.filterSection}>
          <div className={styles.dateFilter}>
            <span className={styles.filterLabel}>Cari Tanggal:</span>
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
                size="lg"
                className={styles.resetButton}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <Card className={styles.emptyState}>
            <CardContent className={styles.emptyContent}>
              <Receipt size={80} className={styles.emptyIcon} />
              <h2 className={styles.emptyTitle}>Belum Ada Transaksi</h2>
              <p className={styles.emptyText}>Tidak ada transaksi untuk periode ini</p>
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
                  <CardContent className={styles.cardContent}>
                    {/* LEFT: Date & Time */}
                    <div className={styles.transactionLeft}>
                      <span className={styles.transactionTime}>
                        {formatTime(transaction.date)}
                      </span>
                      <span className={styles.transactionDate}>
                        {formatDate(transaction.date)}
                      </span>
                    </div>

                    {/* RIGHT: Amount & Items */}
                    <div className={styles.transactionRight}>
                      <span className={styles.totalAmount}>
                        {formatCurrency(transaction.total)}
                      </span>
                      <span className={styles.itemCount}>
                        {transaction.items.length} Barang
                      </span>
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
