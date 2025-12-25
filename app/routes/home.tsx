import { Link } from "react-router";
import { ShoppingCart, Package, Receipt, Settings, Store } from "lucide-react";
import { ColorSchemeToggle } from "~/components/ui/color-scheme-toggle/color-scheme-toggle";
import styles from "./home.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Store className={styles.logo} />
          <div className={styles.titleWrapper}>
            <h1 className={styles.title}>Toko Kori Barokah</h1>
            <p className={styles.subtitle}>Kasir Warung Sederhana</p>
          </div>
          <div className={styles.toggleWrapper}>
            <ColorSchemeToggle />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.navigationGrid}>
          <Link to="/sales" className={styles.navCard}>
            <div className={styles.navCardIconWrapper}>
              <ShoppingCart className={styles.navCardIcon} />
            </div>
            <h3 className={styles.navCardTitle}>Kasir</h3>
          </Link>

          <Link to="/products" className={styles.navCard}>
            <div className={styles.navCardIconWrapper}>
              <Package className={styles.navCardIcon} />
            </div>
            <h3 className={styles.navCardTitle}>Produk</h3>
          </Link>

          <Link to="/riwayat-penjualan" className={styles.navCard}>
            <div className={styles.navCardIconWrapper}>
              <Receipt className={styles.navCardIcon} />
            </div>
            <h3 className={styles.navCardTitle}>Riwayat</h3>
          </Link>

          <Link to="/settings" className={styles.navCard}>
            <div className={styles.navCardIconWrapper}>
              <Settings className={styles.navCardIcon} />
            </div>
            <h3 className={styles.navCardTitle}>Pengaturan</h3>
          </Link>
        </div>
      </main>
    </div>
  );
}
