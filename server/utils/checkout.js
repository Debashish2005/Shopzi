const crypto = require("crypto");

function normalizeCheckoutItems(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
    const error = new Error("Please provide between 1 and 20 products.");
    error.statusCode = 400;
    throw error;
  }

  const quantities = new Map();

  for (const item of items) {
    const productId = Number(item?.product_id);
    const quantity = Number(item?.quantity);

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > 20
    ) {
      const error = new Error("Invalid product or quantity.");
      error.statusCode = 400;
      throw error;
    }

    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  return Array.from(quantities, ([product_id, quantity]) => ({
    product_id,
    quantity,
  }));
}

async function loadCheckoutProducts(connection, items, lockRows = false) {
  const placeholders = items.map(() => "?").join(", ");
  const productIds = items.map((item) => item.product_id);
  const lockClause = lockRows ? " FOR UPDATE" : "";
  const [products] = await connection.query(
    `SELECT id, name, price, stock
     FROM products
     WHERE id IN (${placeholders})${lockClause}`,
    productIds
  );

  const productMap = new Map(products.map((product) => [product.id, product]));

  return items.map((item) => {
    const product = productMap.get(item.product_id);

    if (!product) {
      const error = new Error(`Product ${item.product_id} was not found.`);
      error.statusCode = 404;
      throw error;
    }

    if (Number(product.stock) < item.quantity) {
      const error = new Error(
        `${product.name} has only ${product.stock} item(s) left in stock.`
      );
      error.statusCode = 409;
      throw error;
    }

    const unitPricePaise = Math.round(Number(product.price) * 100);

    return {
      product_id: product.id,
      name: product.name,
      quantity: item.quantity,
      unit_price: unitPricePaise / 100,
      unit_price_paise: unitPricePaise,
    };
  });
}

function calculateTotalPaise(items) {
  return items.reduce(
    (total, item) => total + item.unit_price_paise * item.quantity,
    0
  );
}

async function assertAddressOwnership(connection, addressId, userId) {
  const [addresses] = await connection.query(
    "SELECT id FROM addresses WHERE id = ? AND user_id = ? LIMIT 1",
    [addressId, userId]
  );

  if (addresses.length === 0) {
    const error = new Error("Please select one of your saved addresses.");
    error.statusCode = 404;
    throw error;
  }
}

async function reserveStock(connection, items) {
  for (const item of items) {
    const [result] = await connection.query(
      `UPDATE products
       SET stock = stock - ?
       WHERE id = ? AND stock >= ?`,
      [item.quantity, item.product_id, item.quantity]
    );

    if (result.affectedRows !== 1) {
      const error = new Error(`${item.name} is no longer available in that quantity.`);
      error.statusCode = 409;
      throw error;
    }
  }
}

async function restoreOrderStock(connection, orderId) {
  const [items] = await connection.query(
    `SELECT product_id, quantity
     FROM order_items
     WHERE order_id = ?`,
    [orderId]
  );

  for (const item of items) {
    await connection.query(
      "UPDATE products SET stock = stock + ? WHERE id = ?",
      [item.quantity, item.product_id]
    );
  }
}

function verifyRazorpaySignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  keySecret,
}) {
  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  const expected = Buffer.from(generatedSignature, "utf8");
  const received = Buffer.from(String(razorpaySignature || ""), "utf8");

  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

module.exports = {
  assertAddressOwnership,
  calculateTotalPaise,
  loadCheckoutProducts,
  normalizeCheckoutItems,
  reserveStock,
  restoreOrderStock,
  verifyRazorpaySignature,
};
