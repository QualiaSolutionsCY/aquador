-- Atomic per-product stock decrement for paid orders.
--
-- Closes the oversell race: cart/checkout validation (lib/validation/cart.ts)
-- gates stock at session creation, but products.stock_quantity was never
-- decremented on payment, so two shoppers could both clear the gate for the
-- last unit. This row-locking function decrements exactly the ordered quantity
-- under a FOR UPDATE lock so concurrent paid orders serialize on the product
-- row. Idempotency is enforced by the caller (the Stripe webhook decrements
-- only on the first delivery of a given session — see
-- src/app/api/webhooks/stripe/route.ts), so duplicate webhook deliveries never
-- double-decrement.
--
-- Mirrors the locking pattern of decrement_gift_set_stock
-- (20260207110000_valentine_gift_set.sql).
CREATE OR REPLACE FUNCTION decrement_product_stock(p_id text, p_qty integer)
RETURNS boolean AS $$
DECLARE
  current_qty integer;
BEGIN
  SELECT stock_quantity INTO current_qty
  FROM products
  WHERE id = p_id
  FOR UPDATE;

  IF current_qty IS NULL OR p_qty <= 0 OR current_qty < p_qty THEN
    RETURN false;
  END IF;

  UPDATE products
  SET stock_quantity = stock_quantity - p_qty,
      in_stock = (stock_quantity - p_qty) > 0,
      updated_at = now()
  WHERE id = p_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql;
