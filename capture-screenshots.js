import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const BASE_URL = 'https://localhost:5174';
const SCREENSHOT_DIR = 'public/screenshots';

// Konfigurasi Viewport
const viewport = { width: 1280, height: 800 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startServer() {
    console.log('🚀 Menyalakan server dev sementara...');
    // Spawn npm run dev
    const server = spawn('npm', ['run', 'dev'], {
        shell: true,
        // Detach false agar bisa dikill
        detached: false
    });

    // Tunggu 5 detik agar server siap
    await sleep(5000);
    return server;
}

(async () => {
    // Pastikan direktori ada
    if (!existsSync(SCREENSHOT_DIR)) {
        await mkdir(SCREENSHOT_DIR, { recursive: true });
    }

    let serverProcess;

    try {
        serverProcess = await startServer();
        console.log('⚡ Server seharusnya sudah siap di port 5174 (HTTPS).');

        const browser = await puppeteer.launch({
            headless: 'new',
            ignoreHTTPSErrors: true, // Bypass error SSL self-signed
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--allow-insecure-localhost'
            ],
        });

        const page = await browser.newPage();
        await page.setViewport(viewport);

        const routes = [
            { path: '/', name: 'dashboard.png' },
            { path: '/sales', name: 'transaksi.png' },
            { path: '/products', name: 'products.png' },
            { path: '/riwayat-penjualan', name: 'history.png' },
            { path: '/settings', name: 'settings.png' },
        ];

        for (const route of routes) {
            try {
                const url = `${BASE_URL}${route.path}`;
                console.log(`📸 Mengambil screenshot untuk: ${route.path} ...`);

                // Timeout 30s
                await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

                await sleep(3000);

                await page.screenshot({
                    path: path.join(SCREENSHOT_DIR, route.name),
                    fullPage: false,
                });

                console.log(`✅ Berhasil: ${route.name}`);
            } catch (error) {
                console.error(`❌ Gagal mengambil ${route.path}:`, error.message);
            }
        }

        await browser.close();
        console.log('✨ Selesai! Cek folder public/screenshots.');

    } catch (err) {
        console.error('🔥 Terjadi kesalahan fatal:', err);
    } finally {
        if (serverProcess) {
            console.log('🛑 Mematikan server dev...');
            serverProcess.kill();
            process.exit(0);
        }
    }
})();
