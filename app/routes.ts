import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("sales", "routes/sales.tsx"),
  route("products", "routes/products.tsx"),
  route("riwayat-penjualan", "routes/riwayat-penjualan.tsx"),
  route("riwayat-penjualan/:id", "routes/riwayat-penjualan.$id.tsx"),
  route("settings", "routes/settings.tsx"),
] satisfies RouteConfig;
