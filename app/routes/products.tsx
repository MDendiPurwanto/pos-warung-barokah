import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { ArrowLeft, Plus, Package, TrendingDown, DollarSign, Edit, Trash2, PackagePlus, Minus, Upload, ScanBarcode, Barcode, Printer, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "~/components/ui/button/button";
import { Input } from "~/components/ui/input/input";
import { Label } from "~/components/ui/label/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table/table";
import { toast } from "sonner";
import * as ProductService from "~/services/products.service";
import type { Product } from "~/services/products.service";
import { BarcodeScannerDialog } from "~/components/barcode-scanner-dialog";
import { BarcodeGeneratorDialog } from "~/components/barcode-generator-dialog";
import { PrintPriceTagsDialog } from "~/components/print-price-tags-dialog";
import { PrintPriceListDialog } from "~/components/print-price-list-dialog";
import styles from "./products.module.css";

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPriceListDialogOpen, setIsPriceListDialogOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'add' | 'edit'>('add');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({ name: "", price: "", costPrice: "", stock: "", barcode: "", expiryDate: "" });
  const [stockAdjustment, setStockAdjustment] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    loadProducts();
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

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchQuery))
  );

  const getTimeSafe = (dateStr?: string) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  };

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "stock-asc":
        return a.stock - b.stock;
      case "stock-desc":
        return b.stock - a.stock;
      case "expiry-asc":
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return getTimeSafe(a.expiry_date) - getTimeSafe(b.expiry_date);
      case "expiry-desc":
        if (!a.expiry_date) return 1;
        if (!b.expiry_date) return -1;
        return getTimeSafe(b.expiry_date) - getTimeSafe(a.expiry_date);
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock < 10).length;

  const getDaysUntilExpiry = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const expiredCount = products.filter(p => {
    const days = getDaysUntilExpiry(p.expiry_date);
    return days !== null && days <= 0;
  }).length;

  const expiringSoonCount = products.filter(p => {
    const days = getDaysUntilExpiry(p.expiry_date);
    return days !== null && days > 0 && days <= 30;
  }).length;

  const handleAddProduct = async () => {
    if (!formData.name || !formData.price || !formData.stock) {
      toast.error("Kesalahan Validasi", {
        description: "Silakan isi semua kolom yang wajib diisi",
      });
      return;
    }

    try {
      const newProduct = await ProductService.createProduct({
        name: formData.name,
        price: parseFloat(formData.price),
        cost_price: parseFloat(formData.costPrice || "0"),
        stock: parseInt(formData.stock),
        barcode: formData.barcode || undefined,
        expiry_date: formData.expiryDate || undefined,
      });

      await loadProducts();
      setIsAddDialogOpen(false);
      setFormData({ name: "", price: "", costPrice: "", stock: "", barcode: "", expiryDate: "" });

      toast.success("Produk Ditambahkan", {
        description: `${newProduct.name} berhasil ditambahkan ke inventori`,
      });
    } catch (error) {
      console.error('Error adding product:', error);
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan produk";
      toast.error("Gagal Menambahkan Produk", {
        description: errorMessage,
      });
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct || !formData.name || !formData.price || !formData.stock) {
      toast.error("Kesalahan Validasi", {
        description: "Silakan isi semua kolom yang wajib diisi",
      });
      return;
    }

    try {
      await ProductService.updateProduct(selectedProduct.id, {
        name: formData.name,
        price: parseFloat(formData.price),
        cost_price: parseFloat(formData.costPrice || "0"),
        stock: parseInt(formData.stock),
        barcode: formData.barcode || undefined,
        expiry_date: formData.expiryDate || undefined,
      });

      await loadProducts();
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      setFormData({ name: "", price: "", costPrice: "", stock: "", barcode: "", expiryDate: "" });

      toast.success("Produk Diperbarui", {
        description: "Informasi produk berhasil diperbarui",
      });
    } catch (error) {
      toast.error("Gagal Memperbarui Produk", {
        description: "Terjadi kesalahan saat menyimpan perubahan",
      });
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      await ProductService.deleteProduct(selectedProduct.id);
      await loadProducts();
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);

      toast.success("Produk Dihapus", {
        description: "Produk berhasil dihapus dari inventori",
      });
    } catch (error) {
      toast.error("Gagal Menghapus Produk", {
        description: "Terjadi kesalahan saat menghapus produk",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;

    try {
      await Promise.all(selectedProductIds.map(id => ProductService.deleteProduct(id)));
      await loadProducts();
      setIsBulkDeleteDialogOpen(false);
      setSelectedProductIds([]);

      toast.success("Produk Dihapus", {
        description: `${selectedProductIds.length} produk berhasil dihapus`,
      });
    } catch (error) {
      toast.error("Gagal Menghapus Produk", {
        description: "Terjadi kesalahan saat menghapus produk",
      });
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map(p => p.id));
    }
  };

  const handleStockAdjustment = async () => {
    if (!selectedProduct) return;

    const newStock = selectedProduct.stock + stockAdjustment;

    if (newStock < 0) {
      toast.error("Stok Tidak Valid", {
        description: "Stok tidak boleh negatif",
      });
      return;
    }

    try {
      await ProductService.updateProduct(selectedProduct.id, { stock: newStock });
      await loadProducts();
      setIsStockDialogOpen(false);
      setSelectedProduct(null);
      setStockAdjustment(0);

      toast.success("Stok Diperbarui", {
        description: `Stok disesuaikan ${stockAdjustment > 0 ? "+" : ""}${stockAdjustment}`,
      });
    } catch (error) {
      toast.error("Gagal Memperbarui Stok", {
        description: "Terjadi kesalahan saat menyimpan perubahan stok",
      });
    }
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      costPrice: (product.cost_price || 0).toString(),
      stock: product.stock.toString(),
      barcode: product.barcode || "",
      expiryDate: product.expiry_date || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleScanBarcode = (mode: 'add' | 'edit') => {
    setScannerMode(mode);
    setIsScannerOpen(true);
  };

  const handleBarcodeScanned = (barcode: string) => {
    setFormData({ ...formData, barcode });
    toast.success("Barcode Terdeteksi", {
      description: `Barcode: ${barcode}`,
    });
  };

  const handleGenerateBarcode = (mode: 'add' | 'edit') => {
    if (mode === 'add' && !formData.name) {
      toast.error("Nama Produk Diperlukan", {
        description: "Silakan isi nama produk terlebih dahulu",
      });
      return;
    }
    setScannerMode(mode);
    setIsGeneratorOpen(true);
  };

  const handleBarcodeGenerated = (barcode: string) => {
    setFormData({ ...formData, barcode });
    toast.success("Barcode Dibuat", {
      description: `Barcode: ${barcode}`,
    });
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const openStockDialog = (product: Product) => {
    setSelectedProduct(product);
    setStockAdjustment(0);
    setIsStockDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const newProducts: Product[] = [];
        let validCount = 0;
        let errorCount = 0;

        jsonData.forEach((row, index) => {
          // Expected columns: name, price, stock, barcode (optional)
          const name = row["name"] || row["Name"] || row["Product Name"] || row["Nama"];
          const price = parseFloat(row["price"] || row["Price"] || row["Harga"] || "0");
          const costPrice = parseFloat(row["cost_price"] || row["Cost Price"] || row["Modal"] || "0");
          const stock = parseInt(row["stock"] || row["Stock"] || row["Stok"] || "0");
          const barcode = row["barcode"] || row["Barcode"] || "";

          if (name && price > 0 && stock >= 0) {
            newProducts.push({
              id: `${Date.now()}-${index}`,
              name: String(name),
              price,
              cost_price: costPrice,
              stock,
            });
            validCount++;
          } else {
            errorCount++;
          }
        });

        const importProducts = async () => {
          if (newProducts.length > 0) {
            // Import to Supabase
            for (const product of newProducts) {
              try {
                await ProductService.createProduct({
                  name: product.name,
                  price: product.price,
                  cost_price: product.cost_price,
                  stock: product.stock,
                });
              } catch (err) {
                errorCount++;
                validCount--;
              }
            }

            await loadProducts();
            toast.success("Import Berhasil", {
              description: `${validCount} produk berhasil diimport${errorCount > 0 ? `, ${errorCount} baris gagal` : ""}`,
            });
          } else {
            toast.error("Import Gagal", {
              description: "Tidak ada produk valid di file. Silakan periksa format file.",
            });
          }
        };

        importProducts();
      } catch (error) {
        toast.error("Kesalahan Import", {
          description: "Gagal membaca file Excel. Silakan periksa format file.",
        });
      }
    };
    reader.readAsBinaryString(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const downloadTemplate = () => {
    const template = [
      { name: "Indomie Goreng", price: 3500, stock: 50, barcode: "8992388101015" },
      { name: "Aqua 600ml", price: 3000, stock: 30, barcode: "8993115710017" },
      { name: "Teh Pucuk Harum", price: 4000, stock: 25, barcode: "" },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, "product_import_template.xlsx");

    toast.success("Template Diunduh", {
      description: "Gunakan template ini untuk menyiapkan data produk Anda",
    });
  };

  const openAddDialog = () => {
    setFormData({ name: "", price: "", costPrice: "", stock: "", barcode: "", expiryDate: "" });
    setIsAddDialogOpen(true);
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
            <h1 className={styles.title}>Kelola Produk & Stok</h1>
          </div>
          <div className={styles.headerActions}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            <Button variant="outline" onClick={downloadTemplate} className={styles.templateButton}>
              Unduh Template
            </Button>
            <Button variant="outline" onClick={handleImportClick} className={styles.importButton}>
              <Upload style={{ width: 20, height: 20 }} />
              Import Excel
            </Button>
            <Button onClick={openAddDialog} className={styles.addButton}>
              <Plus style={{ width: 20, height: 20 }} />
              Tambah Produk
            </Button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <DollarSign className={styles.statIcon} />
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Nilai Total</p>
              <p className={styles.statValue}>{formatCurrency(totalValue)}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <TrendingDown className={styles.statIcon} />
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Stok Menipis</p>
              <p className={styles.statValue}>{lowStockCount}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <AlertCircle className={styles.statIcon} style={{ background: 'var(--color-error-3)', color: 'var(--color-error-11)' }} />
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Kedaluwarsa (30 Hari)</p>
              <p className={styles.statValue}>{expiringSoonCount + expiredCount}</p>
            </div>
          </div>
        </div>

        <div className={styles.productSection}>
          <div className={styles.productHeader}>
            <div className={styles.productHeaderLeft}>
              <h2 className={styles.productTitle}>Daftar Produk</h2>
              <div className={styles.searchContainer}>
                <Input
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={styles.searchInput}
                />
              </div>
              <div className={styles.sortContainer}>
                <select
                  className={styles.sortSelect}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name-asc">Nama (A-Z)</option>
                  <option value="name-desc">Nama (Z-A)</option>
                  <option value="stock-asc">Stok (Sedikit)</option>
                  <option value="stock-desc">Stok (Banyak)</option>
                  <option value="expiry-asc">Kedaluwarsa (Terdekat)</option>
                  <option value="expiry-desc">Kedaluwarsa (Terlama)</option>
                </select>
              </div>
            </div>
            <div className={styles.productHeaderActions}>
              {products.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsPrintDialogOpen(true)}
                    className={styles.printButton}
                  >
                    <Printer style={{ width: 18, height: 18 }} />
                    Cetak Tag Harga
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsPriceListDialogOpen(true)}
                    className={styles.printButton}
                  >
                    <Printer style={{ width: 18, height: 18 }} />
                    Cetak Daftar Harga
                  </Button>
                </>
              )}
              {selectedProductIds.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                  className={styles.bulkDeleteButton}
                >
                  <Trash2 style={{ width: 18, height: 18 }} />
                  Hapus {selectedProductIds.length} Produk
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className={styles.emptyState}>
              <Package className={styles.emptyIcon} />
              <p>Memuat produk...</p>
            </div>
          ) : products.length === 0 ? (
            <div className={styles.emptyState}>
              <Package className={styles.emptyIcon} />
              <p>Belum ada produk</p>
              <p style={{ fontSize: "var(--font-size-0)", marginTop: "var(--space-2)" }}>
                Tambahkan produk pertama untuk memulai
              </p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={selectedProductIds.length === products.length && products.length > 0}
                        onChange={toggleSelectAll}
                        style={{ cursor: 'pointer', width: 16, height: 16 }}
                      />
                    </TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Kedaluwarsa</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          style={{ cursor: 'pointer', width: 16, height: 16 }}
                        />
                      </TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell className={product.stock < 10 ? styles.lowStock : ""}>
                        {product.stock} {product.stock < 10 && "⚠️"}
                      </TableCell>
                      <TableCell>
                        {product.expiry_date ? (
                          <span className={
                            new Date(product.expiry_date) <= new Date()
                              ? styles.expiredDate
                              : new Date(product.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                                ? styles.expiringSoonDate
                                : ""
                          }>
                            {new Date(product.expiry_date).toLocaleDateString('id-ID')}
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {product.barcode ? (
                          <code className={styles.barcodeCell}>{product.barcode}</code>
                        ) : (
                          <span className={styles.noBarcodeCell}>-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className={styles.actionButtons}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                            className={styles.actionButton}
                          >
                            <Edit className={styles.actionIcon} />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openStockDialog(product)}
                            className={styles.actionButton}
                          >
                            <PackagePlus className={styles.actionIcon} />
                            Stok
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(product)}
                            className={`${styles.actionButton} ${styles.deleteActionButton}`}
                          >
                            <Trash2 className={styles.actionIcon} />
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoading && filteredProducts.length > 0 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} dari {filteredProducts.length} produk
              </div>
              <div className={styles.paginationControls}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft style={{ width: 16, height: 16 }} />
                </Button>
                <div className={styles.pageNumbers}>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    // Logic to show reasonable page numbers (e.g., around current page)
                    // For simplicity, let's just show standard window or simple logic for now
                    // Simple "smart" window logic:
                    let startPage = Math.max(1, currentPage - 2);
                    if (startPage + 4 > totalPages) {
                      startPage = Math.max(1, totalPages - 4);
                    }
                    return startPage + i;
                  }).map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={styles.pageNumberButton}
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight style={{ width: 16, height: 16 }} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Produk Baru</DialogTitle>
            <DialogDescription>Masukkan detail produk baru</DialogDescription>
          </DialogHeader>
          <div className={styles.formGrid}>
            <div>
              <Label htmlFor="name">Nama Produk *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Indomie Goreng"
              />
            </div>
            <div>
              <Label htmlFor="price">Harga Jual (Rp) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="Contoh: 3500"
              />
            </div>
            <div>
              <Label htmlFor="costPrice">Harga Modal (Rp)</Label>
              <Input
                id="costPrice"
                type="number"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="Contoh: 3000"
              />
            </div>
            <div>
              <Label htmlFor="stock">Stok Awal *</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="Contoh: 50"
              />
            </div>
            <div>
              <Label htmlFor="expiryDate">Tanggal Kedaluwarsa</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="barcode">Barcode (Opsional)</Label>
              <div className={styles.barcodeInputGroup}>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Contoh: 8992388101015"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleScanBarcode('add')}
                  title="Scan Barcode"
                >
                  <ScanBarcode style={{ width: 18, height: 18 }} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleGenerateBarcode('add')}
                  title="Generate Barcode"
                >
                  <Barcode style={{ width: 18, height: 18 }} />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <div className={styles.formActions}>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleAddProduct}>Tambah Produk</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Produk</DialogTitle>
            <DialogDescription>Perbarui informasi produk</DialogDescription>
          </DialogHeader>
          <div className={styles.formGrid}>
            <div>
              <Label htmlFor="edit-name">Nama Produk *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-price">Harga Jual (Rp) *</Label>
              <Input
                id="edit-price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-costPrice">Harga Modal (Rp)</Label>
              <Input
                id="edit-costPrice"
                type="number"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-stock">Stok *</Label>
              <Input
                id="edit-stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-expiryDate">Tanggal Kedaluwarsa</Label>
              <Input
                id="edit-expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-barcode">Barcode</Label>
              <div className={styles.barcodeInputGroup}>
                <Input
                  id="edit-barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Contoh: 8992388101015"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleScanBarcode('edit')}
                  title="Scan Barcode"
                >
                  <ScanBarcode style={{ width: 18, height: 18 }} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleGenerateBarcode('edit')}
                  title="Generate Barcode"
                >
                  <Barcode style={{ width: 18, height: 18 }} />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <div className={styles.formActions}>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleEditProduct}>Simpan Perubahan</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sesuaikan Stok</DialogTitle>
            <DialogDescription>{selectedProduct && `Stok saat ini: ${selectedProduct.stock} unit`}</DialogDescription>
          </DialogHeader>
          <div className={styles.stockAdjustment}>
            <Button variant="outline" onClick={() => setStockAdjustment(stockAdjustment - 1)}>
              <Minus style={{ width: 20, height: 20 }} />
            </Button>
            <Input
              type="number"
              value={stockAdjustment}
              onChange={(e) => setStockAdjustment(parseInt(e.target.value) || 0)}
              className={styles.stockInput}
            />
            <Button variant="outline" onClick={() => setStockAdjustment(stockAdjustment + 1)}>
              <Plus style={{ width: 20, height: 20 }} />
            </Button>
          </div>
          {selectedProduct && (
            <p style={{ textAlign: "center", color: "var(--color-neutral-11)", marginTop: "var(--space-2)" }}>
              Stok baru: {selectedProduct.stock + stockAdjustment} unit
            </p>
          )}
          <DialogFooter>
            <div className={styles.formActions}>
              <Button variant="outline" onClick={() => setIsStockDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleStockAdjustment}>Perbarui Stok</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {selectedProduct?.name}? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedProductIds.length} Produk</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {selectedProductIds.length} produk yang dipilih? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>Hapus Semua</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Barcode Scanner Dialog */}
      {/* Barcode Scanner Dialog */}
      <BarcodeScannerDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleBarcodeScanned}
      />

      {/* Barcode Generator Dialog */}
      {/* Barcode Generator Dialog */}
      <BarcodeGeneratorDialog
        open={isGeneratorOpen}
        onOpenChange={setIsGeneratorOpen}
        productName={formData.name || "Produk"}
        onGenerate={handleBarcodeGenerated}
      />

      {/* Print Price Tags Dialog */}
      {/* Print Price Tags Dialog */}
      <PrintPriceTagsDialog
        open={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
        products={
          selectedProductIds.length > 0
            ? products.filter(p => selectedProductIds.includes(p.id))
            : products
        }
      />

      {/* Print Price List Dialog */}
      <PrintPriceListDialog
        open={isPriceListDialogOpen}
        onOpenChange={setIsPriceListDialogOpen}
        products={
          selectedProductIds.length > 0
            ? products.filter(p => selectedProductIds.includes(p.id))
            : products
        }
      />
    </div>
  );
}
