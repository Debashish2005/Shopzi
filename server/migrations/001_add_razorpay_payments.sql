-- Apply this migration once to the existing Shopzi database.
-- Back up the hosted Railway database before running it there.

ALTER TABLE orders
  ADD COLUMN payment_status
    ENUM('Pending', 'Paid', 'Failed', 'Refunded')
    NOT NULL DEFAULT 'Pending'
    AFTER payment_method,
  ADD INDEX idx_orders_payment_status (payment_status);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  razorpay_order_id VARCHAR(100) NOT NULL,
  razorpay_payment_id VARCHAR(100) NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status ENUM('Created', 'Paid', 'Failed', 'Refunded')
    NOT NULL DEFAULT 'Created',
  payment_method VARCHAR(50) NULL,
  failure_reason VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_payments_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  UNIQUE KEY uq_payments_order (order_id),
  UNIQUE KEY uq_payments_razorpay_order (razorpay_order_id),
  UNIQUE KEY uq_payments_razorpay_payment (razorpay_payment_id),
  INDEX idx_payments_status (status),
  CONSTRAINT chk_payments_amount CHECK (amount >= 0)
);
