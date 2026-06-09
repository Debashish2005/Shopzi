-- Shopzi DBMS project database setup.
-- Run this on a fresh/local MySQL database. It recreates the Shopzi tables
-- and inserts sample data for demonstration.

CREATE DATABASE IF NOT EXISTS shopzi DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE shopzi;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS refunds;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  mobile VARCHAR(15) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_mobile (mobile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE addresses (
  id INT AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  street VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_addresses_user_created (user_id, created_at),
  CONSTRAINT fk_addresses_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE products (
  id INT AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  image_url VARCHAR(500),
  rating FLOAT DEFAULT 0,
  reviews INT DEFAULT 0,
  is_prime BOOLEAN DEFAULT FALSE,
  category VARCHAR(100),
  stock INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_products_name (name),
  KEY idx_products_category (category),
  KEY idx_products_created_at (created_at),
  KEY idx_products_active_stock (is_active, stock),
  CONSTRAINT chk_products_price CHECK (price >= 0),
  CONSTRAINT chk_products_original_price CHECK (original_price IS NULL OR original_price >= 0),
  CONSTRAINT chk_products_rating CHECK (rating >= 0 AND rating <= 5),
  CONSTRAINT chk_products_reviews CHECK (reviews >= 0),
  CONSTRAINT chk_products_stock CHECK (stock >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE product_images (
  id INT AUTO_INCREMENT,
  product_id INT NOT NULL,
  image_url VARCHAR(1000) NOT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_product_images_product_url (product_id, image_url(255)),
  KEY idx_product_images_product (product_id),
  CONSTRAINT fk_product_images_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE cart_items (
  id INT AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_cart_items_user_product (user_id, product_id),
  KEY idx_cart_items_user (user_id),
  KEY idx_cart_items_product (product_id),
  CONSTRAINT fk_cart_items_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cart_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_cart_items_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE orders (
  id INT AUTO_INCREMENT,
  user_id INT NOT NULL,
  address_id INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_status ENUM('Pending', 'Paid', 'Failed', 'RefundPending', 'Refunded') NOT NULL DEFAULT 'Pending',
  status VARCHAR(50) NOT NULL DEFAULT 'Placed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_orders_user_created (user_id, created_at),
  KEY idx_orders_address (address_id),
  KEY idx_orders_status (status),
  KEY idx_orders_payment_status (payment_status),
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_orders_address
    FOREIGN KEY (address_id) REFERENCES addresses(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_orders_total_amount CHECK (total_amount >= 0),
  CONSTRAINT chk_orders_payment_method CHECK (payment_method IN ('COD', 'Razorpay')),
  CONSTRAINT chk_orders_status CHECK (status IN ('Placed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE order_items (
  id INT AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY uq_order_items_order_product (order_id, product_id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_order_items_quantity CHECK (quantity > 0),
  CONSTRAINT chk_order_items_price CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE payments (
  id INT AUTO_INCREMENT,
  order_id INT NOT NULL,
  razorpay_order_id VARCHAR(100) NOT NULL,
  razorpay_payment_id VARCHAR(100),
  amount DECIMAL(10, 2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status ENUM('Created', 'Paid', 'Failed', 'RefundPending', 'Refunded') NOT NULL DEFAULT 'Created',
  payment_method VARCHAR(50),
  failure_reason VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_order (order_id),
  UNIQUE KEY uq_payments_razorpay_order (razorpay_order_id),
  UNIQUE KEY uq_payments_razorpay_payment (razorpay_payment_id),
  KEY idx_payments_status (status),
  CONSTRAINT fk_payments_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_payments_amount CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE refunds (
  id INT AUTO_INCREMENT,
  order_id INT NOT NULL,
  payment_id INT NOT NULL,
  razorpay_refund_id VARCHAR(100),
  amount DECIMAL(10, 2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status ENUM('Initiated', 'Pending', 'Processed', 'Failed') NOT NULL DEFAULT 'Initiated',
  failure_reason VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

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

CREATE TABLE password_reset_tokens (
  id INT AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_password_reset_tokens_token (token),
  KEY idx_password_reset_tokens_user_created (user_id, created_at),
  CONSTRAINT fk_password_reset_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

START TRANSACTION;

-- Sample users. Demo passwords:
-- Riya Sharma: Password@123
-- Arjun Mehta: Demo@12345
INSERT INTO users (id, full_name, email, mobile, password_hash, role) VALUES
(1, 'Riya Sharma', 'riya.sharma@example.com', '9876543210', '$2b$10$SW5RweukwO3I.J7/cJU5uOhNKZ4bm4RPocj7cNsU5adp0gPtF937y', 'admin'),
(2, 'Arjun Mehta', 'arjun.mehta@example.com', '9123456780', '$2b$10$OgmY0mvGqb8SjulNXOBKZOs4CF5mVbuMXuKbpoi8O3rqKy9P/aZeO', 'customer');

INSERT INTO addresses (id, user_id, name, street, city, state, pincode) VALUES
(1, 1, 'Riya Sharma', '221 MG Road', 'Bengaluru', 'Karnataka', '560001'),
(2, 1, 'Riya Sharma', 'Flat 4B, Lake View Apartments', 'Kolkata', 'West Bengal', '700091'),
(3, 2, 'Arjun Mehta', '17 Park Street', 'Mumbai', 'Maharashtra', '400001');

INSERT INTO products
  (id, name, description, price, original_price, image_url, rating, reviews, is_prime, category, stock, is_active)
VALUES
(1, 'Smart Plugs', 'Wi-Fi enabled smart plug for home automation.', 799.00, 999.00, '/images/Smart Plugs.webp', 4.3, 128, TRUE, 'Electronics', 40, TRUE),
(2, 'Running Shoes', 'Lightweight running shoes with cushioned sole.', 2499.00, 3299.00, '/Running Shoes.webp', 4.5, 214, TRUE, 'Footwear', 25, TRUE),
(3, 'Samsung Galaxy M16', '5G smartphone with AMOLED display and long battery life.', 13999.00, 16999.00, '/images/Samsung Galaxy M16.webp', 4.2, 89, FALSE, 'Mobiles', 18, TRUE),
(4, 'Cotton Track Pants', 'Comfortable cotton track pants for everyday wear.', 899.00, 1299.00, '/Cotton Track Pants.webp', 4.1, 64, FALSE, 'Fashion', 55, TRUE);

INSERT INTO product_images (id, product_id, image_url) VALUES
(1, 1, '/images/Smart Plugs.webp'),
(2, 2, '/Running Shoes.webp'),
(3, 3, '/images/Samsung Galaxy M16.webp'),
(4, 4, '/Cotton Track Pants.webp');

INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES
(1, 1, 1, 2),
(2, 1, 2, 1),
(3, 2, 4, 2);

INSERT INTO orders
  (id, user_id, address_id, total_amount, payment_method, payment_status, status)
VALUES
(1, 1, 1, 3298.00, 'COD', 'Pending', 'Placed'),
(2, 2, 3, 1798.00, 'Razorpay', 'Refunded', 'Cancelled');

INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES
(1, 1, 1, 1, 799.00),
(2, 1, 2, 1, 2499.00),
(3, 2, 4, 2, 899.00);

INSERT INTO payments
  (id, order_id, razorpay_order_id, razorpay_payment_id, amount, currency, status, payment_method)
VALUES
(1, 2, 'order_sample_shopzi_2', 'pay_sample_shopzi_2', 1798.00, 'INR', 'Refunded', 'card');

INSERT INTO refunds
  (id, order_id, payment_id, razorpay_refund_id, amount, currency, status)
VALUES
(1, 2, 1, 'rfnd_sample_shopzi_2', 1798.00, 'INR', 'Processed');

INSERT INTO password_reset_tokens (id, user_id, token) VALUES
(1, 1, 'sample-reset-token-riya');

COMMIT;

-- Development-only cleanup example from project notes:
-- DELETE FROM products WHERE name = 'Samsung Galaxy S23 Ultra';
