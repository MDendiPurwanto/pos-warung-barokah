# Deployment ke Coolify

Panduan lengkap untuk deploy aplikasi POS ini ke Coolify di VPS pribadi.

## Prerequisites

1. VPS dengan Coolify sudah terinstall
2. Domain atau subdomain (opsional, bisa pakai IP)
3. Akun Supabase dengan project yang sudah dikonfigurasi
4. Repository Git (GitHub, GitLab, atau Gitea)

## Persiapan Aplikasi

### 1. Environment Variables

Aplikasi membutuhkan environment variables berikut:

```env
# Supabase Configuration
SUPABASE_PROJECT_URL=https://your-project.supabase.co
SUPABASE_API_KEY=your-supabase-anon-key

# Node Environment
NODE_ENV=production
```

### 2. Database Setup

Pastikan database Supabase sudah dikonfigurasi dengan schema yang sesuai. Jalankan script SQL berikut di Supabase SQL Editor:

```sql
-- Lihat file supabase-schema.sql untuk schema lengkap
```

## Deployment Steps di Coolify

### 1. Login ke Coolify Dashboard

Akses Coolify dashboard di `https://your-coolify-domain.com` atau `http://your-vps-ip:8000`

### 2. Create New Project

1. Klik "New Project"
2. Beri nama project (contoh: `pos-system`)

### 3. Add Application

1. Di dalam project, klik "Add New Resource" → "Application"
2. Pilih "Public Repository" atau "Private Repository" (jika menggunakan GitHub/GitLab)
3. Masukkan Git repository URL:
   - Format HTTPS: `https://github.com/username/repo.git`
   - Format SSH: `git@github.com:username/repo.git`

### 4. Configure Build Settings

Di tab **General**:

- **Build Pack**: Pilih `nixpacks` (recommended) atau `dockerfile`
- **Branch**: Pilih branch yang akan di-deploy (contoh: `main`)
- **Port**: `3000` (default port untuk React Router v7)
- **Domain**: Masukkan domain/subdomain atau biarkan kosong untuk menggunakan IP

Di tab **Build**:

Jika menggunakan Nixpacks, Coolify akan auto-detect. Tapi Anda bisa custom dengan menambahkan file `nixpacks.toml`:

```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm run start"
```

### 5. Environment Variables

Di tab **Environment Variables**, tambahkan:

```
SUPABASE_PROJECT_URL=https://your-project.supabase.co
SUPABASE_API_KEY=your-supabase-anon-key
NODE_ENV=production
```

**Tips**: Aktifkan "Show During Build" untuk variabel yang diperlukan saat build.

### 6. Deploy

1. Klik "Deploy" atau "Save & Deploy"
2. Tunggu proses build selesai (biasanya 2-5 menit)
3. Cek logs untuk memastikan tidak ada error

### 7. Health Check (Opsional)

Di tab **Health Check**, configure:

- **Path**: `/` 
- **Port**: `3000`
- **Interval**: `30s`
- **Timeout**: `5s`
- **Retries**: `3`

## Custom Domain (Opsional)

### 1. Setup DNS

Di DNS provider Anda, tambahkan A record:

```
Type: A
Name: pos (atau subdomain lain)
Value: [IP VPS Anda]
TTL: 300
```

### 2. Configure di Coolify

1. Di tab **Domains**, klik "Add Domain"
2. Masukkan domain lengkap (contoh: `pos.yourdomain.com`)
3. Coolify akan otomatis setup SSL dengan Let's Encrypt

## Dockerfile (Alternatif)

Jika ingin menggunakan Dockerfile custom, buat file `Dockerfile` di root project:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built app from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start application
CMD ["npm", "run", "start"]
```

Kemudian di Coolify, pilih **Build Pack**: `dockerfile`

## Troubleshooting

### Build Failed

1. **Cek Logs**: Lihat build logs di Coolify untuk error message
2. **Memory**: Pastikan VPS punya cukup RAM (minimal 2GB untuk build)
3. **Dependencies**: Pastikan semua dependencies ada di `package.json`

### Application Won't Start

1. **Port**: Pastikan port 3000 tidak bentrok dengan aplikasi lain
2. **Environment Variables**: Cek semua env vars sudah benar
3. **Database**: Pastikan Supabase project aktif dan accessible

### SSL Certificate Issues

1. Pastikan DNS sudah propagate (cek di https://dnschecker.org)
2. Port 80 dan 443 harus terbuka di firewall VPS
3. Tunggu beberapa menit untuk Let's Encrypt provisioning

### Build Timeout

Jika build timeout, tambahkan di Coolify settings:
- Increase build timeout di Server settings
- Atau gunakan VPS dengan spek lebih tinggi

## Update & Redeploy

### Auto Deploy (CI/CD)

Coolify bisa auto-deploy saat ada push ke branch:

1. Di tab **General**, aktifkan "Watch Paths"
2. Set "Auto Deploy" ke `true`
3. Setiap push ke branch akan trigger deployment otomatis

### Manual Deploy

1. Buka aplikasi di Coolify dashboard
2. Klik "Deploy" atau "Redeploy"
3. Pilih "Force Rebuild" jika perlu rebuild dari awal

## Backup & Restore

### Database Backup

Gunakan Supabase built-in backup atau export manual:

```bash
# Export dari Supabase
pg_dump "postgresql://..." > backup.sql

# Import ke Supabase baru
psql "postgresql://..." < backup.sql
```

### Application Backup

Coolify otomatis menyimpan deployment history. Untuk rollback:

1. Buka aplikasi di Coolify
2. Klik "Deployments"
3. Pilih deployment sebelumnya dan klik "Redeploy"

## Monitoring

### Logs

Akses logs realtime di Coolify:
1. Buka aplikasi
2. Klik tab "Logs"
3. Pilih "Application Logs" atau "Build Logs"

### Metrics

Coolify menampilkan metrics dasar:
- CPU usage
- Memory usage
- Network traffic

Untuk monitoring lebih detail, install Grafana/Prometheus terpisah.

## Performance Tips

### 1. Enable Node.js Production Mode

Pastikan `NODE_ENV=production` di environment variables

### 2. Optimize Build

Tambahkan di `package.json`:

```json
{
  "scripts": {
    "build": "react-router build",
    "postbuild": "echo 'Build completed successfully'"
  }
}
```

### 3. Use PM2 (Opsional)

Install PM2 untuk process management:

```bash
npm install -g pm2
```

Update start command di Coolify:
```
pm2-runtime start npm -- start
```

### 4. Enable Compression

React Router v7 sudah include compression by default di production mode.

## Security Checklist

- [ ] Environment variables tidak di-commit ke Git
- [ ] Supabase RLS (Row Level Security) aktif
- [ ] API keys menggunakan Supabase anon key (bukan service key)
- [ ] HTTPS aktif untuk production domain
- [ ] Firewall VPS dikonfigurasi dengan benar
- [ ] Regular security updates untuk VPS

## Support

Jika ada masalah:
1. Cek Coolify documentation: https://coolify.io/docs
2. Cek React Router docs: https://reactrouter.com/
3. Cek Supabase docs: https://supabase.com/docs

## Estimasi Resources

Minimum VPS requirements:
- **CPU**: 1 vCore
- **RAM**: 2GB (untuk build) / 512MB (untuk runtime)
- **Storage**: 10GB
- **Bandwidth**: 1TB/month

Recommended VPS specs:
- **CPU**: 2 vCore
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Bandwidth**: 2TB/month
