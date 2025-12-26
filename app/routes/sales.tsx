import { useState, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, ShoppingCart, ScanBarcode, Plus, Minus, X, Package, Printer, Search, Wallet, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog/dialog";
import { Button } from "~/components/ui/button/button";
import { Input } from "~/components/ui/input/input";
import * as ProductService from "~/services/products.service";
import * as TransactionService from "~/services/transactions.service";
import type { Product } from "~/services/products.service";
import { toast } from "sonner";
import { BluetoothPrinterDialog } from "~/components/bluetooth-printer-dialog";
import { BarcodeScannerDialog } from "~/components/barcode-scanner-dialog";
import { bluetoothPrinterService } from "~/lib/bluetooth-printer";
import type { ReceiptData } from "~/lib/bluetooth-printer";
import { FullscreenToggle } from "~/components/ui/fullscreen-toggle";
import { RefreshButton } from "~/components/ui/refresh-button";
import classNames from "classnames";
import styles from "./sales.module.css";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function Sales() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [showPrinterDialog, setShowPrinterDialog] = useState(false);
  const [pendingPrint, setPendingPrint] = useState<ReceiptData | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  const categories = ["Semua", "Minuman", "Makanan", "Sembako", "Rokok", "Obat", "Lainnya"];

  // Helper to categorize products on the fly (since data doesn't have it yet)
  const getProductCategory = (name: string): string => {
    const n = name.toLowerCase();
    // Cek Rokok dulu karena ada kata "Garam" yang bisa bentrok dengan Sembako
    if (
      n.includes("rokok") ||
      n.includes("surya") ||
      n.includes("sampoerna") ||
      n.includes("sampurna") ||
      n.includes("gudang garam") ||
      n.includes("kretek") ||
      n.includes("filter") ||
      n.includes("djaja") ||
      n.includes("djarum") ||
      n.includes("magnum") ||
      n.includes("ji sam soe") ||
      n.includes("ares") ||
      n.includes("layar") ||
      n.includes("sriwidary") ||
      n.includes("dji samsu")
    ) return "Rokok";

    // Cek Obat-obatan/Minyak Angin agar tidak masuk Sembako (Minyak Goreng)
    if (
      n.includes("minyak angin") ||
      n.includes("kayu putih") ||
      n.includes("kapak") ||
      n.includes("lang") ||
      n.includes("1001") ||
      n.includes("i00i") ||
      n.includes("vicks") ||
      n.includes("balsem") ||
      n.includes("obat") ||
      n.includes("puyer") ||
      n.includes("paracetamol") ||
      n.includes("panadol") ||
      n.includes("bodrex") ||
      n.includes("promag") ||
      n.includes("freshCare") ||
      n.includes("freshcare") ||
      n.includes("larutan") ||
      n.includes("angin") ||
      n.includes("Tolak")
    ) return "Obat";

    if (n.includes("aqua") || n.includes("teh") || n.includes("kopi") || n.includes("minum") || n.includes("susu") || n.includes("cola")) return "Minuman";
    if (n.includes("indomie") || n.includes("snack") || n.includes("biskuit") || n.includes("roti") || n.includes("Mie Goreng") || n.includes("Sedap")) return "Makanan";
    if (n.includes("beras") || n.includes("minyak") || n.includes("gula") || n.includes("garam") || n.includes("tepung") || n.includes("goreng") || n.includes("gas") || n.includes("kecap") || n.includes("telur") || n.includes("telur")) return "Sembako";

    return "Lainnya";
  };


  useEffect(() => {
    loadProducts();

    // Focus search on 'S' key or any alphabetic key if not focused
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        const searchInput = document.querySelector(`.${styles.searchInput}`) as HTMLInputElement;
        searchInput?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await ProductService.getProducts();
      setProducts(data);
    } catch (error) {
      toast.error("Gagal Memuat Produk", {
        description: "Terjadi kesalahan saat memuat data produk",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchQuery));

    const matchesCategory =
      selectedCategory === "Semua" || getProductCategory(product.name) === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      toast.error("Stok Habis", {
        description: `${product.name} sedang habis stok`,
      });
      return;
    }

    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error("Batas Stok Tercapai", {
          description: `Hanya tersedia ${product.stock} unit`,
        });
        return;
      }
      setCart(cart.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }

    toast.success("Ditambahkan ke Keranjang", {
      description: `${product.name} berhasil ditambahkan`,
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    const item = cart.find((item) => item.product.id === productId);
    if (!item) return;

    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > item.product.stock) {
      toast.error("Batas Stok Tercapai", {
        description: `Hanya tersedia ${item.product.stock} unit`,
      });
      return;
    }

    setCart(
      cart.map((cartItem) => (cartItem.product.id === productId ? { ...cartItem, quantity: newQuantity } : cartItem)),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  const calculateChange = () => {
    const payment = parseFloat(paymentAmount) || 0;
    const total = calculateTotal();
    return payment - total;
  };

  const isPaymentSufficient = () => {
    return parseFloat(paymentAmount) >= calculateTotal();
  };

  const completeSale = async (printReceipt = false) => {
    if (cart.length === 0) {
      toast.error("Keranjang Kosong", {
        description: "Silakan tambah produk sebelum menyelesaikan transaksi",
      });
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) < calculateTotal()) {
      toast.error("Pembayaran Tidak Cukup", {
        description: "Jumlah uang yang dibayarkan kurang dari total belanja",
      });
      return;
    }

    try {
      const total = calculateTotal();
      const payment = parseFloat(paymentAmount);
      const change = payment - total;

      // Save transaction
      const transaction = await TransactionService.createTransaction({
        date: new Date().toISOString(),
        customerName: "Walk-in Customer",
        total,
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        })),
      });

      // Update stock levels
      for (const item of cart) {
        await ProductService.updateProductStock(item.product.id, item.quantity);
      }

      // Prepare receipt data
      if (printReceipt) {
        const receiptData: ReceiptData = {
          storeName: 'TOKO SAYA',
          storeAddress: 'Jl. Contoh No. 123, Jakarta',
          transactionId: transaction.id,
          date: new Date().toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          items: cart.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            total: item.product.price * item.quantity
          })),
          subtotal: total,
          total,
          payment,
          change,
          paymentMethod: 'Tunai'
        };

        // Check if printer is connected
        if (bluetoothPrinterService.isConnected()) {
          try {
            await bluetoothPrinterService.printReceipt(receiptData);
            toast.success("Transaksi Selesai & Struk Dicetak", {
              description: `Total: Rp ${total.toLocaleString("id-ID")}`,
            });
          } catch (error) {
            toast.warning("Transaksi Selesai", {
              description: "Gagal mencetak struk. Total: Rp " + total.toLocaleString("id-ID"),
            });
          }
        } else {
          // Save for later and show printer dialog
          setPendingPrint(receiptData);
          setShowPrinterDialog(true);
          toast.success("Transaksi Selesai", {
            description: `Total: Rp ${total.toLocaleString("id-ID")}. Hubungkan printer untuk cetak struk.`,
          });
        }
      } else {
        toast.success("Transaksi Selesai", {
          description: `Total: Rp ${total.toLocaleString("id-ID")}`,
        });
      }

      await loadProducts();
      setCart([]);
      setPaymentAmount("");
      setIsPaymentOpen(false);
    } catch (error) {
      toast.error("Gagal Menyimpan Transaksi", {
        description: "Terjadi kesalahan saat memproses transaksi",
      });
    }
  };

  const cancelSale = () => {
    setCart([]);
    setPaymentAmount("");
    toast.info("Transaksi Dibatalkan", {
      description: "Keranjang telah dikosongkan",
    });
  };

  const handlePaymentChange = (value: string) => {
    // Only allow numbers and decimal point
    const sanitized = value.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = sanitized.split('.');
    if (parts.length > 2) return;
    setPaymentAmount(sanitized);
  };

  const setQuickAmount = (amount: number) => {
    setPaymentAmount(amount.toString());
  };

  const setExactAmount = () => {
    setPaymentAmount(calculateTotal().toString());
  };

  const handleScan = () => {
    setIsScannerOpen(true);
  };

  const handleBarcodeDetected = (barcode: string) => {
    const scannedCode = barcode.trim();
    const product = products.find((p) => p.barcode?.trim() === scannedCode);

    if (product) {
      addToCart(product);
      setIsScannerOpen(false);
    } else {
      toast.error("Produk Tidak Ditemukan", {
        description: `Tidak ada produk dengan barcode: ${barcode}`,
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  const handlePrinterConnected = async () => {
    if (pendingPrint) {
      try {
        await bluetoothPrinterService.printReceipt(pendingPrint);
        toast.success("Struk Berhasil Dicetak", {
          description: "Struk transaksi telah dicetak",
        });
      } catch (error) {
        toast.error("Gagal Mencetak Struk", {
          description: error instanceof Error ? error.message : "Terjadi kesalahan",
        });
      } finally {
        setPendingPrint(null);
        setShowPrinterDialog(false);
      }
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <Link to="/" className={styles.backButton}>
              <ArrowLeft style={{ width: 20, height: 20 }} />
              Kembali
            </Link>
            <h1 className={styles.title}>Kasir</h1>
          </div>
          <div className={styles.headerActions}>
            <RefreshButton />
            <FullscreenToggle />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.leftPanel}>
          <div className={styles.searchSection}>
            <div className={styles.searchHeader}>
              <div className={styles.searchInputWrapper}>
                <Search className={styles.searchIcon} />
                <Input
                  type="text"
                  placeholder="Cari produk atau scan barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                  autoFocus
                />
                {searchQuery && (
                  <button className={styles.clearSearch} onClick={() => setSearchQuery("")}>
                    <X style={{ width: 16, height: 16 }} />
                  </button>
                )}
              </div>
              <Button onClick={handleScan} className={styles.scanButton} variant="secondary">
                <ScanBarcode className={styles.scanIcon} />
                Kamera
              </Button>
            </div>

            <div className={styles.categoryBar}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={classNames(styles.categoryTab, {
                    [styles.activeCategory]: selectedCategory === cat,
                  })}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className={styles.productGrid}>
              {filteredProducts.map((product) => (
                <div key={product.id} className={styles.productCard} onClick={() => addToCart(product)}>
                  <h3 className={styles.productName}>{product.name}</h3>
                  <p className={styles.productPrice}>{formatCurrency(product.price)}</p>
                  <p className={styles.productStock}>
                    <Package className={styles.stockIcon} />
                    Stok: {product.stock}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.cartSection}>
            <div className={styles.cartHeader}>
              <h2 className={styles.cartTitle}>
                <ShoppingCart className={styles.cartIcon} />
                Transaksi Saat Ini
              </h2>
            </div>

            <div className={styles.cartContent}>
              {cart.length === 0 ? (
                <div className={styles.emptyCart}>
                  <ShoppingCart className={styles.emptyCartIcon} />
                  <p>Keranjang kosong</p>
                  <p style={{ fontSize: "var(--font-size-0)", marginTop: "var(--space-2)" }}>
                    Tambah produk untuk memulai transaksi
                  </p>
                </div>
              ) : (
                <div className={styles.cartItems}>
                  {cart.map((item) => (
                    <div key={item.product.id} className={styles.cartItem}>
                      <div className={styles.cartItemInfo}>
                        <h4 className={styles.cartItemName}>{item.product.name}</h4>
                        <p className={styles.cartItemPrice}>
                          {formatCurrency(item.product.price)} × {item.quantity} ={" "}
                          {formatCurrency(item.product.price * item.quantity)}
                        </p>
                      </div>
                      <div className={styles.cartItemControls}>
                        <button className={styles.quantityButton} onClick={() => updateQuantity(item.product.id, -1)}>
                          <Minus className={styles.quantityIcon} />
                        </button>
                        <span className={styles.quantity}>{item.quantity}</span>
                        <button
                          className={styles.quantityButton}
                          onClick={() => updateQuantity(item.product.id, 1)}
                          disabled={item.quantity >= item.product.stock}
                        >
                          <Plus className={styles.quantityIcon} />
                        </button>
                        <button className={styles.removeButton} onClick={() => removeFromCart(item.product.id)}>
                          <X className={styles.removeIcon} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.cartFooter}>
              <div className={styles.totalRow}>
                <h3 className={styles.totalLabel}>Total</h3>
                <p className={styles.totalAmount}>{formatCurrency(calculateTotal())}</p>
              </div>

              <div className={styles.cartActions}>
                <Button
                  onClick={() => setIsPaymentOpen(true)}
                  disabled={cart.length === 0}
                  className={styles.mainPayButton}
                  size="lg"
                >
                  <Wallet className={styles.actionIcon} />
                  BAYAR SEKARANG
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelSale}
                  disabled={cart.length === 0}
                  className={styles.cancelButton}
                >
                  Dibatalkan / Hapus Semua
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Dialog - Focused Step for Accessibility */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className={styles.paymentModal}>
          <DialogHeader>
            <DialogTitle className={styles.paymentModalTitle}>
              <Wallet style={{ width: 28, height: 28 }} />
              Proses Pembayaran
            </DialogTitle>
            <DialogDescription>Masukkan jumlah uang yang diterima dari pelanggan</DialogDescription>
          </DialogHeader>

          <div className={styles.paymentGrid}>
            <div className={styles.paymentSummary}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total Belanja:</span>
                <span className={styles.summaryValueTotal}>{formatCurrency(calculateTotal())}</span>
              </div>

              <div className={styles.paymentInputArea}>
                <label className={styles.paymentLabelBig}>Uang Diterima (Rp):</label>
                <div className={styles.paymentInputWrapperLarge}>
                  <Input
                    type="text"
                    inputMode="none"
                    value={paymentAmount}
                    onChange={(e) => handlePaymentChange(e.target.value)}
                    className={styles.paymentInputLarge}
                    placeholder="0"
                    autoFocus
                  />
                  <Button onClick={setExactAmount} variant="secondary" className={styles.fullButton}>
                    Uang Pas
                  </Button>
                </div>

                <div className={styles.quickAmountsGrid}>
                  {[10000, 20000, 50000, 100000].map((amount) => (
                    <button
                      key={amount}
                      className={styles.quickButton}
                      onClick={() => setQuickAmount(amount)}
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>
              </div>

              {paymentAmount && (
                <div className={classNames(styles.changeContainer, {
                  [styles.changeContainerNegative]: calculateChange() < 0,
                  [styles.changeContainerPositive]: calculateChange() >= 0
                })}>
                  <span className={styles.changeLabelLarge}>
                    {calculateChange() < 0 ? "Kurang Bayar:" : "Uang Kembalian:"}
                  </span>
                  <span className={styles.changeValueLarge}>
                    {formatCurrency(Math.abs(calculateChange()))}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.numpadContainerLarge}>
              <div className={styles.numpadLarge}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "0", "000", "Hapus"].map((key) => (
                  <button
                    key={key}
                    className={classNames(styles.numpadButtonLarge, {
                      [styles.numpadButtonClr]: key === "Hapus"
                    })}
                    onClick={() => {
                      if (key === "Hapus") setPaymentAmount("");
                      else if (key === "000") setPaymentAmount((prev: string) => prev + "000");
                      else setPaymentAmount((prev: string) => prev + key);
                    }}
                  >
                    {key}
                  </button>
                ))}
              </div>

              <div className={styles.paymentActionButtons}>
                <Button
                  size="lg"
                  disabled={!isPaymentSufficient()}
                  onClick={() => completeSale(false)}
                  className={styles.finalizeButton}
                >
                  <CheckCircle2 style={{ width: 24, height: 24 }} />
                  SELESAI & SIMPAN
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsPaymentOpen(false)}
                  className={styles.backToCartBtn}
                >
                  Kembali ke Keranjang
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner Dialog */}
      <BarcodeScannerDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleBarcodeDetected}
      />

      {/* Bluetooth Printer Dialog */}
      <BluetoothPrinterDialog
        open={showPrinterDialog}
        onOpenChange={(open) => {
          setShowPrinterDialog(open);
          if (!open) setPendingPrint(null);
        }}
        onConnected={handlePrinterConnected}
      />
    </div>
  );
}
