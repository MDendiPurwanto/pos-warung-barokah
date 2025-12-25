export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  barcode?: string;
}

export const initialProducts: Product[] = [
  {
    id: "1",
    name: "Indomie Goreng",
    price: 3500,
    stock: 50,
    barcode: "8992388101015",
  },
  {
    id: "2",
    name: "Aqua 600ml",
    price: 4000,
    stock: 30,
    barcode: "8991234567890",
  },
  {
    id: "3",
    name: "Teh Botol Sosro",
    price: 5000,
    stock: 25,
    barcode: "8992745123456",
  },
  {
    id: "4",
    name: "Kopi Kapal Api",
    price: 2500,
    stock: 40,
    barcode: "8992745234567",
  },
  {
    id: "5",
    name: "Beras Premium 5kg",
    price: 75000,
    stock: 15,
    barcode: "8991234678901",
  },
  {
    id: "6",
    name: "Minyak Goreng 1L",
    price: 18000,
    stock: 20,
    barcode: "8992745345678",
  },
  {
    id: "7",
    name: "Gula Pasir 1kg",
    price: 15000,
    stock: 18,
    barcode: "8991234789012",
  },
  {
    id: "8",
    name: "Telur Ayam (10pcs)",
    price: 28000,
    stock: 12,
    barcode: "8992745456789",
  },
];
