import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import type { Route } from "./+types/root";
import { getSupabaseEnv } from "./lib/supabase.server";
import { Toaster } from "./components/ui/sonner/sonner";
import colorSchemeApi from "@dazl/color-scheme/client?url";

import "./styles/reset.css";
import "./styles/global.css";
import "./styles/tokens/keyframes.css";
import "./styles/tokens/animations.css";
import "./styles/tokens/colors.css";
import "./styles/tokens/decorations.css";
import "./styles/tokens/spacings.css";
import "./styles/tokens/typography.css";
import "./styles/theme.css";
import { useColorScheme } from "@dazl/color-scheme/react";
import favicon from "/favicon.svg";

export const meta: Route.MetaFunction = () => {
  return [
    { title: "POS Warung Barokah" },
    { name: "description", content: "Aplikasi Kasir POS Warung Barokah - Solusi manajemen warung yang mudah, cepat, dan modern." },
    { property: "og:title", content: "POS Warung Barokah" },
    { property: "og:description", content: "Kelola warung Anda dengan lebih efisien menggunakan POS Warung Barokah. Pencatatan transaksi, stok, dan laporan dalam satu aplikasi." },
    { property: "og:image", content: "/favicon.svg" },
    { property: "og:site_name", content: "POS Warung Barokah" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: "POS Warung Barokah" },
    { name: "twitter:description", content: "Aplikasi Kasir POS Warung Barokah - Solusi manajemen warung yang mudah, cepat, dan modern." },
    { name: "twitter:image", content: "/favicon.svg" },
  ];
};

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "icon",
    href: favicon,
    type: "image/svg+xml",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export async function loader() {
  const { url, key } = getSupabaseEnv();
  return {
    ENV: {
      SUPABASE_URL: url,
      SUPABASE_ANON_KEY: key,
    },
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { rootCssClass, resolvedScheme } = useColorScheme();
  return (
    <html lang="en" suppressHydrationWarning className={rootCssClass} style={{ colorScheme: resolvedScheme }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <script src={colorSchemeApi}></script>
        <Links />
      </head>
      <body>
        {children}
        <Toaster richColors position="top-right" />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.ENV = ${JSON.stringify(loaderData?.ENV || {})}`
        }}
      />
      <Outlet />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
