import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    basicSsl()
  ],
  server: {
    host: true, // Listen on all addresses (0.0.0.0)
    port: 5174,
  }
});
