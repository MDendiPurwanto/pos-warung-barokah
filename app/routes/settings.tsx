import { useState } from "react";
import { Printer, Bluetooth, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card/card";
import { bluetoothPrinterService } from "~/lib/bluetooth-printer";
import { toast } from "sonner";
import styles from "./settings.module.css";
import type { Route } from "./+types/settings";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Pengaturan - Point of Sale" }];
}

export default function Settings() {
  const [isConnected, setIsConnected] = useState(false);
  const [printerName, setPrinterName] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await bluetoothPrinterService.connect();
      setIsConnected(true);
      setPrinterName(bluetoothPrinterService.getPrinterName() || "Printer Bluetooth");
      toast.success("Berhasil terhubung ke printer!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal terhubung ke printer");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await bluetoothPrinterService.disconnect();
      setIsConnected(false);
      setPrinterName("");
      toast.success("Printer terputus");
    } catch (error) {
      toast.error("Gagal memutuskan koneksi");
    }
  };

  const handleTestPrint = async () => {
    try {
      await bluetoothPrinterService.printReceipt({
        storeName: "TEST PRINT",
        transactionId: "TEST-001",
        date: new Date(),
        items: [
          { name: "Test Item 1", quantity: 1, price: 10000 },
          { name: "Test Item 2", quantity: 2, price: 15000 },
        ],
        subtotal: 40000,
        tax: 4000,
        total: 44000,
        payment: 50000,
        change: 6000,
      });
      toast.success("Test print berhasil!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mencetak test print");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to="/" className={styles.backButton}>
          <ArrowLeft className={styles.backIcon} />
          Kembali
        </Link>
        <h1 className={styles.title}>Pengaturan</h1>
        <p className={styles.subtitle}>Kelola pengaturan aplikasi Point of Sale</p>
      </div>

      <div className={styles.content}>
        <Card>
          <CardHeader>
            <CardTitle className={styles.cardTitle}>
              <Printer className={styles.icon} />
              Printer Bluetooth
            </CardTitle>
            <CardDescription>
              Hubungkan aplikasi dengan printer thermal Bluetooth untuk mencetak struk penjualan
            </CardDescription>
          </CardHeader>
          <CardContent className={styles.cardContent}>
            {isConnected ? (
              <div className={styles.connectedState}>
                <div className={styles.statusBadge}>
                  <CheckCircle className={styles.statusIcon} />
                  <div className={styles.statusInfo}>
                    <span className={styles.statusLabel}>Terhubung</span>
                    <span className={styles.printerName}>{printerName}</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  <Button variant="outline" onClick={handleTestPrint}>
                    Test Print
                  </Button>
                  <Button variant="destructive" onClick={handleDisconnect}>
                    Putuskan Koneksi
                  </Button>
                </div>
              </div>
            ) : (
              <div className={styles.disconnectedState}>
                <div className={styles.statusBadge}>
                  <XCircle className={styles.statusIconDisconnected} />
                  <div className={styles.statusInfo}>
                    <span className={styles.statusLabel}>Tidak Terhubung</span>
                    <span className={styles.statusDescription}>
                      Belum ada printer yang terhubung
                    </span>
                  </div>
                </div>

                <Button onClick={handleConnect} disabled={isConnecting} className={styles.connectButton}>
                  <Bluetooth className={styles.buttonIcon} />
                  {isConnecting ? "Menghubungkan..." : "Hubungkan Printer"}
                </Button>
              </div>
            )}

            <div className={styles.info}>
              <h4 className={styles.infoTitle}>Petunjuk:</h4>
              <ul className={styles.infoList}>
                <li>Pastikan printer Bluetooth Anda dalam keadaan menyala</li>
                <li>Aktifkan mode pairing pada printer</li>
                <li>Klik tombol "Hubungkan Printer" dan pilih printer dari daftar</li>
                <li>Gunakan "Test Print" untuk memastikan printer berfungsi dengan baik</li>
                <li>Printer yang sudah terhubung akan otomatis digunakan saat mencetak struk</li>
              </ul>
            </div>

            <div className={styles.compatibility}>
              <strong>Kompatibilitas:</strong> Fitur ini memerlukan browser Chrome, Edge, atau Opera
              dengan Web Bluetooth API. Printer harus mendukung protokol ESC/POS.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
