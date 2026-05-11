# Shopzi DBMS Report

## Project Overview

Shopzi is an e-commerce DBMS project built with a React frontend, Node.js/Express backend, and MySQL database. The database stores users, addresses, products, product images, cart items, orders, order items, and password reset tokens. The backend performs authenticated CRUD operations and uses SQL joins and a transaction for order placement.

## Database Design

The database name is `shopzi`, using `utf8mb4` character encoding for broad Unicode support. The main entities are:

- `users`: customer account and login identity.
- `addresses`: saved delivery addresses owned by users.
- `products`: product catalog details such as price, category, stock, rating, and review count.
- `product_images`: separate image records for products, allowing multiple images per product.
- `cart_items`: products selected by a user before checkout.
- `orders`: order header information such as user, address, total, payment method, and status.
- `order_items`: products inside each order, including quantity and price snapshot.
- `password_reset_tokens`: reset tokens linked to users.

## Normalization

The schema follows practical third normal form:

- 1NF: Each field stores atomic values. Product images are stored in `product_images` instead of repeating image columns in `products`.
- 2NF: Tables with relationship data, such as `cart_items` and `order_items`, store facts about the whole relationship, not only part of it.
- 3NF: Non-key fields depend on the table key. For example, user details stay in `users`, address details stay in `addresses`, and product details stay in `products`.

Some denormalized snapshot data is intentionally stored in `order_items.price`. This preserves the historical order price even if the product price changes later.

## Relationships

- `users` to `addresses`: one-to-many.
- `users` to `cart_items`: one-to-many.
- `users` to `orders`: one-to-many.
- `users` to `password_reset_tokens`: one-to-many.
- `products` to `product_images`: one-to-many.
- `products` to `cart_items`: one-to-many.
- `orders` to `order_items`: one-to-many.
- `products` to `order_items`: one-to-many.
- `addresses` to `orders`: one-to-many.

## Constraints And Indexes

Primary keys uniquely identify each table row. Foreign keys enforce referential integrity between parent and child tables. Important constraints include:

- Unique email and mobile number in `users`.
- Unique product per user in `cart_items`, preventing duplicate cart rows for the same user and product.
- Unique reset token in `password_reset_tokens`.
- Check constraints for positive prices, stock, quantities, ratings, and valid order statuses.
- Cascading deletes for dependent records such as addresses, cart items, product images, order items, and password reset tokens.

Indexes are added on common lookup columns such as user IDs, product IDs, categories, order status, and created dates. These support faster search, cart loading, address lookup, and order history queries.

## CRUD Operations

The backend implements CRUD operations across the major entities:

- Create: signup, add address, add product, add cart item, place order, create password reset token.
- Read: login user lookup, profile fetch, address list, product search, product details, cart view, order history.
- Update: profile update, address update, password change, cart quantity update.
- Delete: address delete, cart item removal, order cancellation, password reset token cleanup.

All user-scoped operations use the authenticated user ID to prevent one user from accessing or modifying another user's data.

## Joins And Queries

The app uses joins for meaningful multi-table views:

- Cart loading joins `cart_items` with `products` to display product names, prices, quantities, and images.
- Order history joins `orders`, `order_items`, `products`, and product image data to show complete order details.
- Product listing uses a subquery to fetch a primary product image for each product.

These queries demonstrate relational retrieval instead of storing all display data in one table.

## Transaction Use

Order placement uses a database transaction. The backend starts a transaction, creates the order row, inserts order item rows, clears the user's cart, and commits only if all steps succeed. If any step fails, it rolls back the transaction so partial orders are not stored.

This is important because checkout changes multiple related tables. A transaction keeps the database consistent.

## Sample Data

The `schema.sql` file includes sample users, addresses, products, images, cart items, orders, order items, and a password reset token. This makes the project easier to demonstrate without manually entering data first.

## Conclusion

The Shopzi schema is suitable for a DBMS project because it includes multiple related entities, primary and foreign keys, unique constraints, indexes, normalized table design, CRUD operations, joins, and transaction handling. It models a realistic e-commerce workflow from account creation through checkout and order history.
