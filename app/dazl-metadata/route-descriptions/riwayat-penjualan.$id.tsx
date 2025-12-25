interface SuggestedRoute {
  title: string;
  uri: string;
}

interface RouteDescription {
  suggestedRoutes: SuggestedRoute[];
  itemTitle: string;
}

export function getRouteDescription(): RouteDescription {
  return {
    suggestedRoutes: [
      {
        title: 'Transaksi TRX-001',
        uri: '/riwayat-penjualan/TRX-001',
      },
      {
        title: 'Transaksi TRX-002',
        uri: '/riwayat-penjualan/TRX-002',
      },
      {
        title: 'Transaksi TRX-003',
        uri: '/riwayat-penjualan/TRX-003',
      },
    ],
    itemTitle: 'Transaksi',
  };
}
