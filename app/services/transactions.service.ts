import { supabase } from '../lib/supabase.client';
import { transactions as mockTransactions } from '../data/transactions';

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

export async function getTransactions(): Promise<Transaction[]> {
  if (!supabase) {
    return mockTransactions;
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  
  return (data || []).map((row: any) => ({
    id: row.id,
    date: row.date,
    customerName: row.customer_name,
    total: row.total,
    items: row.items as unknown as TransactionItem[]
  }));
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  if (!supabase) {
    return mockTransactions.find(t => t.id === id) || null;
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  
  if (!data) return null;

  return {
    id: data.id,
    date: data.date,
    customerName: data.customer_name,
    total: data.total,
    items: data.items as unknown as TransactionItem[]
  };
}

export async function createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
  if (!supabase) {
    const newTransaction: Transaction = {
      id: `TXN${Date.now()}`,
      ...transaction
    };
    mockTransactions.unshift(newTransaction);
    return newTransaction;
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      date: transaction.date,
      customer_name: transaction.customerName,
      total: transaction.total,
      items: transaction.items as any
    }])
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    date: data.date,
    customerName: data.customer_name,
    total: data.total,
    items: data.items as unknown as TransactionItem[]
  };
}
