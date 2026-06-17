-- Add a per-product manual stock quantity to products.
--
-- Behavior: MANUAL count only (no auto-decrement on purchase). The existing
-- `in_stock` boolean stays as the availability flag driving ordering/filtering/
-- badges; it is derived (in_stock = stock_quantity > 0) whenever quantity is
-- saved from the admin. The storefront shows an "Only X left" hint when
-- stock_quantity is between 1 and 5 (inclusive).

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0;

-- Keep negative counts out.
ALTER TABLE products
  ADD CONSTRAINT products_stock_quantity_nonnegative CHECK (stock_quantity >= 0);

-- Backfill so the existing catalog does not all read as out of stock: any row
-- currently flagged in_stock = true gets a comfortable default count.
-- Rows with in_stock = false (or null) stay at 0.
UPDATE products
SET stock_quantity = 99
WHERE in_stock = true
  AND stock_quantity = 0;
