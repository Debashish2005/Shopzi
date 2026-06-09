-- Apply this migration once to the existing Railway Shopzi database.
-- Archived products remain available to historical order records but are hidden
-- from the storefront and checkout.

ALTER TABLE products
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE
  AFTER stock,
  ADD INDEX idx_products_active_stock (is_active, stock);
