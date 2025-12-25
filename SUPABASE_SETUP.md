# Setup Supabase untuk POS Application

## Langkah-langkah Setup

### 1. Buka SQL Editor di Supabase Dashboard

1. Masuk ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Klik menu **SQL Editor** di sidebar kiri
4. Klik **New Query**

### 2. Jalankan SQL Schema

Copy dan paste SQL berikut ke SQL Editor, lalu klik **Run**:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  barcode TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  customer_name TEXT NOT NULL,
  total INTEGER NOT NULL CHECK (total >= 0),
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_name);

-- Create function to update product stock
CREATE OR REPLACE FUNCTION update_product_stock(product_id TEXT, quantity_change INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock = stock + quantity_change
  WHERE id = product_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', product_id;
  END IF;
  
  IF (SELECT stock FROM products WHERE id = product_id) < 0 THEN
    RAISE EXCEPTION 'Insufficient stock for product: %', product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert initial products data
INSERT INTO products (id, name, price, stock, barcode) VALUES
  ('prod-1', 'Indomie', 3500, 50, '8992388101015'),
  ('prod-2', 'Aqua', 4000, 30, '8993115710017'),
  ('prod-3', 'Teh Botol', 5000, 25, '8992761111014'),
  ('prod-4', 'Kopi', 2500, 40, '8991002101425'),
  ('prod-5', 'Beras', 75000, 15, NULL),
  ('prod-6', 'Minyak', 18000, 20, NULL),
  ('prod-7', 'Gula', 15000, 18, NULL),
  ('prod-8', 'Telur', 28000, 12, NULL)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert access for all users" ON products;
DROP POLICY IF EXISTS "Enable update access for all users" ON products;
DROP POLICY IF EXISTS "Enable delete access for all users" ON products;

DROP POLICY IF EXISTS "Enable read access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable insert access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable update access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable delete access for all users" ON transactions;

-- Create policies for public access
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON products FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON products FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON transactions FOR DELETE USING (true);
```

### 3. Verifikasi Setup

Setelah SQL berhasil dijalankan, verifikasi dengan:

1. Klik menu **Table Editor** di sidebar
2. Anda seharusnya melihat 2 tabel:
   - `products` (dengan 8 produk awal)
   - `transactions`

### 4. Test di Aplikasi

Setelah database setup selesai, coba:
1. Refresh aplikasi POS Anda
2. Buka halaman **Products**
3. Coba tambah produk baru
4. Seharusnya tidak ada error lagi!

## Struktur Database

### Tabel `products`
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | TEXT | Primary key (UUID) |
| name | TEXT | Nama produk |
| price | INTEGER | Harga dalam rupiah |
| stock | INTEGER | Stok tersedia |
| barcode | TEXT | Barcode produk (optional) |
| created_at | TIMESTAMP | Waktu dibuat |

### Tabel `transactions`
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | TEXT | Primary key (UUID) |
| date | TIMESTAMP | Tanggal transaksi |
| customer_name | TEXT | Nama pelanggan |
| total | INTEGER | Total harga |
| items | JSONB | Detail item yang dibeli |
| created_at | TIMESTAMP | Waktu dibuat |

## Troubleshooting

### Error: "relation already exists"
Ini normal jika tabel sudah ada sebelumnya. SQL menggunakan `CREATE TABLE IF NOT EXISTS` jadi aman dijalankan berulang kali.

### Error: "policy already exists"
SQL sudah include `DROP POLICY IF EXISTS` sebelum membuat policy baru, jadi harusnya tidak ada masalah.

### Produk tidak muncul
1. Cek di Table Editor apakah data ada
2. Pastikan RLS policies sudah aktif
3. Cek console browser untuk error

### Tidak bisa insert/update/delete
Pastikan RLS policies sudah dibuat dengan benar. Jalankan ulang bagian CREATE POLICY di SQL Editor.

## Security Notes

⚠️ **Penting**: Setup ini menggunakan RLS policies yang mengizinkan akses publik untuk development. 

Untuk production, Anda harus:
1. Implement authentication (Supabase Auth)
2. Update RLS policies untuk check user authentication
3. Tambah validasi di backend

Contoh policy untuk authenticated users:
```sql
CREATE POLICY "Authenticated users can read" 
ON products FOR SELECT 
USING (auth.role() = 'authenticated');
```
