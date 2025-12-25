# Quick Start - Supabase Setup

## ⚠️ PENTING: Database Setup Required!

Aplikasi ini menggunakan **Supabase** sebagai database. Anda perlu setup database terlebih dahulu sebelum aplikasi berfungsi.

## Setup Cepat (5 menit)

### 1️⃣ Credentials sudah tersimpan ✓

Credentials Supabase Anda sudah disimpan:
- Project URL: `https://aolxtkyqpbqxbboccoqkt.supabase.co`
- Anon Key: (tersimpan dengan aman)

### 2️⃣ Buat Database Tables

**Ikuti langkah berikut:**

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project `aolxtkyqpbqxbboccoqkt`
3. Klik **SQL Editor** di menu kiri
4. Klik **New Query**
5. Copy semua SQL dari file `supabase-schema.sql` (ada di root project)
6. Paste ke SQL Editor
7. Klik tombol **Run** atau tekan `Ctrl+Enter`

### 3️⃣ Verifikasi

Setelah SQL berhasil dijalankan:
1. Klik **Table Editor** di menu Supabase
2. Anda akan melihat 2 tabel:
   - ✓ `products` (dengan 8 produk contoh)
   - ✓ `transactions`

### 4️⃣ Test Aplikasi

1. Refresh aplikasi POS
2. Buka halaman **Products**
3. Coba tambah produk baru
4. Seharusnya berhasil tanpa error!

---

## 📖 Dokumentasi Lengkap

Untuk panduan detail, troubleshooting, dan security notes, baca file `SUPABASE_SETUP.md`.

## 🆘 Troubleshooting Cepat

**Error saat tambah produk?**
→ Database tables belum dibuat. Ikuti langkah di atas.

**Data tidak muncul?**
→ Cek di Supabase Table Editor apakah data ada.

**Error permission?**
→ Pastikan RLS policies sudah dibuat (ada di SQL schema).

---

## 🔐 Security Note

Setup ini menggunakan public access untuk development. Untuk production:
- Enable Supabase Authentication
- Update RLS policies
- Lihat detail di `SUPABASE_SETUP.md`
