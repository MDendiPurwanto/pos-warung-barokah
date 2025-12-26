import { supabase } from '../lib/supabase.client';
import { initialProducts as mockProducts } from '../data/products';

export interface Product {
  id: string;
  name: string;
  price: number;
  cost_price?: number;
  stock: number;
  barcode?: string;
}

export async function getProducts(): Promise<Product[]> {
  if (!supabase) {
    console.warn('Supabase not configured, using mock data');
    return mockProducts;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');

  if (error) {
    console.error('Supabase error:', error);
    throw new Error(error.message || 'Gagal memuat produk');
  }
  return data || [];
}

export async function getProduct(id: string): Promise<Product | null> {
  if (!supabase) {
    return mockProducts.find(p => p.id === id) || null;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  if (!supabase) {
    throw new Error('Supabase belum terkonfigurasi. Silakan cek file .env Anda dan pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sudah diisi dengan benar.');
  }

  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    throw new Error(error.message || 'Gagal menyimpan produk ke database');
  }
  return data;
}

export async function updateProduct(id: string, updates: Partial<Omit<Product, 'id'>>): Promise<Product> {
  if (!supabase) {
    throw new Error('Supabase belum terkonfigurasi. Silakan cek file .env Anda.');
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    throw new Error(error.message || 'Gagal memperbarui produk');
  }
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase belum terkonfigurasi. Silakan cek file .env Anda.');
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase error:', error);
    throw new Error(error.message || 'Gagal menghapus produk');
  }
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  if (!supabase) {
    return mockProducts.find(p => p.barcode === barcode) || null;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .single();

  if (error) return null;
  return data;
}

export async function updateProductStock(id: string, quantity: number): Promise<void> {
  if (!supabase) {
    const product = mockProducts.find(p => p.id === id);
    if (product) {
      product.stock -= quantity;
    }
    return;
  }

  const { error } = await supabase.rpc('update_product_stock', {
    product_id: id,
    quantity_change: -quantity
  });

  if (error) {
    // Fallback to manual update if RPC doesn't exist
    const product = await getProduct(id);
    if (product) {
      await updateProduct(id, { stock: product.stock - quantity });
    }
  }
}
