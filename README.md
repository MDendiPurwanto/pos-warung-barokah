# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 CSS Modules for styling
- 📖 [React Router docs](https://reactrouter.com/)

### Styling & Theming

- This project uses CSS modules as the styling solution, Radix as the component library, and Open Props for styling tokens and theming
- Project theme is defined in `app/styles/theme.css`, used as a design system for all UI building
- Base design tokens are defined in `app/styles/tokens/<token-type>.css`, used as an immutable base design system for all the theme and all UI

## Screenshot & Cara Penggunaan

Berikut adalah panduan singkat penggunaan aplikasi POS Warung Barokah beserta tampilan antarmukanya.

### Tampilan Aplikasi

> *Catatan: Tambahkan file gambar ke dalam folder project (misalnya `public/screenshots/`) dan sesuaikan path di bawah ini.*

| Dashboard | Halaman Transaksi |
|:---:|:---:|
| *[Screenshot Dashboard]* | *[Screenshot Transaksi]* |
| `![Dashboard](/screenshots/dashboard.png)` | `![Transaksi](/screenshots/transaksi.png)` |

| Manajemen Produk | Riwayat Penjualan |
|:---:|:---:|
| *[Screenshot Produk]* | *[Screenshot Riwayat]* |
| `![Produk](/screenshots/products.png)` | `![Riwayat](/screenshots/history.png)` |

| Pengaturan Aplikasi | |
|:---:|:---:|
| *[Screenshot Settings]* | |
| `![Settings](/screenshots/settings.png)` | |

### Panduan Penggunaan

1. **Dashboard Overview**
   - Melihat total penjualan harian dan ringkasan transaksi.
   - Navigasi cepat ke menu utama menggunakan sidebar atau quick links.

2. **Melakukan Transaksi**
   - Masuk ke menu **Transaksi**.
   - Pilih kategori produk untuk menyaring item, atau gunakan pencarian.
   - Klik kartu produk untuk menambahkannya ke keranjang belanja.
   - Sesuaikan jumlah item di panel kanan.
   - Pilih metode pembayaran dan klik **Bayar** untuk menyelesaikan transaksi.

3. **Manajemen Produk**
   - Masuk ke menu **Produk**.
   - Klik tombol **Tambah Produk** untuk input stok baru.
   - Klik ikon edit pada produk untuk mengubah harga atau stok.

4. **Riwayat Penjualan**
   - Akses menu **Riwayat** untuk melihat log transaksi.
   - Klik pada salah satu transaksi untuk melihat detail item yang terjual.

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```
