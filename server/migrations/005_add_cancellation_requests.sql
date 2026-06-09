-- Apply this migration once to the existing Railway Shopzi database.
-- It adds an auditable customer cancellation-request approval workflow.

CREATE TABLE order_cancellation_requests (
  id INT AUTO_INCREMENT,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  reason VARCHAR(500) NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  reviewed_by INT,
  admin_note VARCHAR(500),
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL DEFAULT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_cancellation_requests_order (order_id),
  KEY idx_cancellation_requests_user (user_id),
  KEY idx_cancellation_requests_status_requested (status, requested_at),
  KEY idx_cancellation_requests_reviewer (reviewed_by),
  CONSTRAINT fk_cancellation_requests_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cancellation_requests_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cancellation_requests_reviewer
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_cancellation_requests_reason
    CHECK (CHAR_LENGTH(TRIM(reason)) BETWEEN 10 AND 500)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
