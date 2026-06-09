-- Apply this migration once to the existing Railway Shopzi database.
-- It adds auditable Razorpay refund records and pending refund states.

ALTER TABLE orders
  MODIFY COLUMN payment_status
    ENUM('Pending', 'Paid', 'Failed', 'RefundPending', 'Refunded')
    NOT NULL DEFAULT 'Pending';

ALTER TABLE payments
  MODIFY COLUMN status
    ENUM('Created', 'Paid', 'Failed', 'RefundPending', 'Refunded')
    NOT NULL DEFAULT 'Created';

CREATE TABLE refunds (
  id INT AUTO_INCREMENT,
  order_id INT NOT NULL,
  payment_id INT NOT NULL,
  razorpay_refund_id VARCHAR(100),
  amount DECIMAL(10, 2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status ENUM('Initiated', 'Pending', 'Processed', 'Failed')
    NOT NULL DEFAULT 'Initiated',
  failure_reason VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_refunds_order (order_id),
  UNIQUE KEY uq_refunds_razorpay_refund (razorpay_refund_id),
  KEY idx_refunds_payment (payment_id),
  KEY idx_refunds_status (status),
  CONSTRAINT fk_refunds_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_refunds_payment
    FOREIGN KEY (payment_id) REFERENCES payments(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_refunds_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
