-- ============================================================
-- M4 P1 T2 · OPTIMIZE H16 · POLISH-10
-- orders.customer_id FK adoption + backfill
-- ============================================================
--
-- Context:
--   The admin dashboard's `getCustomerOrderHistory(customerId)` resolved
--   the customer's email and then queried orders by `customer_email` —
--   a denormalized join that silently disconnects historical orders if
--   the customer's email is ever edited on the `customers` row.
--
--   The OPTIMIZE.md H16 finding stated the `customer_id` FK already
--   existed and just wasn't populated. On inspection of the live DB this
--   is not true: the column is absent, and the historical
--   `idx_orders_customer_id` index (added in
--   20260303_add_performance_indexes.sql) was actually defined ON
--   `customer_email` despite the misleading name. So this migration
--   ADDS the column, defines the FK, backfills from existing
--   `customer_email` matches, and creates a correctly-named covering
--   index on the new column.
--
-- Back-compat:
--   `customer_email` is intentionally KEPT on the orders row. H16 is
--   about FK adoption — column removal is a separate later migration so
--   any read path still relying on the denormalized email keeps working
--   through the transition.
--
-- Idempotency:
--   Every DDL/DML statement uses an IF [NOT] EXISTS guard or
--   conditional check (DO $$ ... $$ for the FK constraint). The whole
--   migration is wrapped in a single transaction so a partial failure
--   rolls back cleanly and the file is safe to re-run.
-- ============================================================

BEGIN;

-- 1. Add the FK column. ON DELETE SET NULL preserves order history if
--    a customer row is ever deleted (the order remains; the link drops).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_id uuid NULL;

-- 2. Attach the FK constraint to customers(id). Guarded via pg_constraint
--    lookup so re-running doesn't raise "constraint already exists".
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_customer_id_fkey'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_customer_id_fkey
      FOREIGN KEY (customer_id)
      REFERENCES public.customers(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

-- 3. Backfill: link every existing order whose customer_email matches a
--    customers.email to that customer's UUID. Only touches NULL rows so
--    re-running is idempotent and never overwrites a value the webhook
--    has since written.
UPDATE public.orders o
SET customer_id = c.id
FROM public.customers c
WHERE o.customer_email = c.email
  AND o.customer_id IS NULL;

-- 4. Covering index on the new column. The legacy
--    `idx_orders_customer_id` (defined on customer_email in
--    20260303_add_performance_indexes.sql) is left in place to avoid a
--    cross-migration rename; this one uses a distinct, accurate name so
--    `getCustomerOrderHistory` can rely on a real B-tree on the FK.
CREATE INDEX IF NOT EXISTS idx_orders_customer_id_fk
  ON public.orders (customer_id);

COMMIT;
