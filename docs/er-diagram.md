# Shopzi ER Diagram

```mermaid
erDiagram
    USERS ||--o{ ADDRESSES : has
    USERS ||--o{ CART_ITEMS : owns
    USERS ||--o{ ORDERS : places
    USERS ||--o{ PASSWORD_RESET_TOKENS : requests
    PRODUCTS ||--o{ PRODUCT_IMAGES : has
    PRODUCTS ||--o{ CART_ITEMS : appears_in
    PRODUCTS ||--o{ ORDER_ITEMS : sold_as
    ADDRESSES ||--o{ ORDERS : used_for
    ORDERS ||--|{ ORDER_ITEMS : contains
    ORDERS ||--o| PAYMENTS : paid_through
    ORDERS ||--o| REFUNDS : may_create
    PAYMENTS ||--o| REFUNDS : reversed_by

    USERS {
        INT id PK
        VARCHAR full_name
        VARCHAR email UK
        VARCHAR mobile UK
        VARCHAR password_hash
        ENUM role
        TIMESTAMP created_at
    }

    ADDRESSES {
        INT id PK
        INT user_id FK
        VARCHAR name
        VARCHAR street
        VARCHAR city
        VARCHAR state
        VARCHAR pincode
        TIMESTAMP created_at
    }

    PRODUCTS {
        INT id PK
        VARCHAR name
        TEXT description
        DECIMAL price
        DECIMAL original_price
        VARCHAR image_url
        FLOAT rating
        INT reviews
        BOOLEAN is_prime
        VARCHAR category
        INT stock
        BOOLEAN is_active
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    PRODUCT_IMAGES {
        INT id PK
        INT product_id FK
        VARCHAR image_url
    }

    CART_ITEMS {
        INT id PK
        INT user_id FK
        INT product_id FK
        INT quantity
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    ORDERS {
        INT id PK
        INT user_id FK
        INT address_id FK
        DECIMAL total_amount
        VARCHAR payment_method
        ENUM payment_status
        VARCHAR status
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    ORDER_ITEMS {
        INT id PK
        INT order_id FK
        INT product_id FK
        INT quantity
        DECIMAL price
    }

    PAYMENTS {
        INT id PK
        INT order_id FK,UK
        VARCHAR razorpay_order_id UK
        VARCHAR razorpay_payment_id UK
        DECIMAL amount
        CHAR currency
        ENUM status
        VARCHAR payment_method
        VARCHAR failure_reason
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    REFUNDS {
        INT id PK
        INT order_id FK,UK
        INT payment_id FK
        VARCHAR razorpay_refund_id UK
        DECIMAL amount
        CHAR currency
        ENUM status
        VARCHAR failure_reason
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    PASSWORD_RESET_TOKENS {
        INT id PK
        INT user_id FK
        VARCHAR token UK
        TIMESTAMP created_at
    }
```

## Relationship Summary

- One user can save many addresses, cart items, orders, and password reset tokens.
- One product can have many image records, cart entries, and order item records.
- One order belongs to one user and one delivery address.
- One order contains one or more order item rows.
- One online order has at most one Shopzi payment record.
- One paid online order can have at most one full-refund record.
- `order_items.price` stores the product price at purchase time so old orders keep their original price even if the product price later changes.
- `products.is_active` supports soft deletion: archived products disappear from the storefront while existing order-item foreign keys remain valid.
