-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  cost_price INTEGER DEFAULT 0 CHECK (cost_price >= 0),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  barcode TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  customer_name TEXT NOT NULL,
  total INTEGER NOT NULL CHECK (total >= 0),
  profit INTEGER DEFAULT 0,
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_name);

-- Create function to update product stock (optional, for atomic operations)
CREATE OR REPLACE FUNCTION update_product_stock(product_id TEXT, quantity_change INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET stock = stock + quantity_change
  WHERE id = product_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', product_id;
  END IF;
  
  -- Check if stock is negative
  IF (SELECT stock FROM products WHERE id = product_id) < 0 THEN
    RAISE EXCEPTION 'Insufficient stock for product: %', product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert initial products data
INSERT INTO products (id, name, price, stock, barcode) VALUES
  ('prod-1', 'Indomie', 3500, 50, '8992388101015'),
  ('prod-2', 'Aqua', 4000, 30, '8993115710017'),
  ('prod-3', 'Teh Botol', 5000, 25, '8992761111014'),
  ('prod-4', 'Kopi', 2500, 40, '8991002101425'),
  ('prod-5', 'Beras', 75000, 15, NULL),
  ('prod-6', 'Minyak', 18000, 20, NULL),
  ('prod-7', 'Gula', 15000, 18, NULL),
  ('prod-8', 'Telur', 28000, 12, NULL)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can modify these based on your needs)
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON products FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON products FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON transactions FOR DELETE USING (true);
