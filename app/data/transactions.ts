export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Transaction {
  id: string;
  date: string;
  customerName: string;
  total: number;
  items: TransactionItem[];
}

export const transactions: Transaction[] = [
  {
    id: 'TXN001',
    date: new Date().toISOString(),
    customerName: 'Ahmad',
    total: 15000,
    items: [
      { productId: '1', productName: 'Indomie Goreng', quantity: 2, price: 3500 },
      { productId: '4', productName: 'Kopi Kapal Api', quantity: 3, price: 2500 },
    ],
  },
];
