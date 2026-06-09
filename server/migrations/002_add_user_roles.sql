-- Apply this migration once to the existing Shopzi database.
-- User ID 1 is promoted only to preserve the project's current admin account.
-- Future authorization must use users.role, never a hard-coded user ID.

ALTER TABLE users
  ADD COLUMN role ENUM('customer', 'admin')
  NOT NULL DEFAULT 'customer'
  AFTER password_hash;

UPDATE users
SET role = 'admin'
WHERE id = 1;
