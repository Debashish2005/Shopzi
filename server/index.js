require('dotenv').config();
const express = require('express');
const db = require('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path  = require("path");
const nodemailer = require("nodemailer");
const { cloudinary, storage } = require("./utils/cloudinary");
const multer = require("multer");
const Razorpay = require("razorpay");
const {
  assertAddressOwnership,
  calculateTotalPaise,
  loadCheckoutProducts,
  normalizeCheckoutItems,
  reserveStock,
  restoreOrderStock,
  verifyRazorpaySignature,
} = require("./utils/checkout");

const upload = multer({ storage });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,     // Your Gmail
    pass: process.env.EMAIL_PASS,     // App password
  },
});

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3000;


app.use(cookieParser());

app.use(cors({
  origin: process.env.FRONTEND_URL, // your frontend dev URL
  credentials: true
}));

app.use(express.json()); 




function auth(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "No token provided." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      full_name: decoded.full_name, // ✅ now available
    };
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ message: "Invalid or expired token." });
  }
}


app.post('/signup', async (req, res) => {
  const { full_name, email, mobile, password } = req.body;

  if (!full_name || !email || !password || !mobile) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  try {
    // 1. Check if email or mobile already exists
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE email = ? OR mobile = ?',
      [email, mobile]
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.email === email) {
        return res.status(409).json({ message: 'Email already registered' });
      } else {
        return res.status(409).json({ message: 'Mobile number already registered' });
      }
    }

    // 2. Hash password and insert new user
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (full_name, email, mobile, password_hash) VALUES (?, ?, ?, ?)',
      [full_name, email, mobile, hashedPassword]
    );

    res.status(201).json({ message: 'User created successfully' });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);

    if (rows.length === 0)
      return res.status(400).json({ error: 'User not found' });

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash); 

    if (!isMatch)
      return res.status(400).json({ error: 'Invalid credentials' });

    // JWT creation
const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    full_name: user.full_name // 👈 include full_name here
  },
  JWT_SECRET,
  { expiresIn: '1d' }
);


    // Set cookie
res.cookie("token", token, {
  httpOnly: true,
  secure: true, // 
  sameSite: "None", 
  maxAge: 7 * 24 * 60 * 60 * 1000, // optional: 1 week
});


    res.status(200).json({ message: 'Login successful' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post("/change-password", auth, async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: "New passwords do not match." });
  }

  try {
    const [rows] = await db.execute("SELECT password_hash FROM users WHERE id = ?", [req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.execute("UPDATE users SET password_hash = ? WHERE id = ?", [hashed, req.user.id]);

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required." });

  try {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found." });

    const user = rows[0];

    // Token logic (JWT or random token)
// Generate random token (or JWT)
const token = Math.random().toString(36).substring(2, 15);

// Save to DB
await db.execute("INSERT INTO password_reset_tokens (user_id, token) VALUES (?, ?)", [user.id, token]);

// Email reset link
const resetLink = `http://localhost:5173/reset-password/${token}`;


    // TODO: Save the token in DB against user for verification (new table or column)

    // Send mail
    await transporter.sendMail({
      from: `"Shopzi Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>Hello ${user.full_name},</p>
        <p>You requested to reset your password.</p>
        <p><a href="${resetLink}">Click here to reset it</a></p>
        <p>If you didn’t request this, just ignore this email.</p>
      `,
    });

    res.json({ message: "Password reset email sent!" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Failed to send email." });
  }
});

app.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) return res.status(400).json({ message: "Token and password required" });

  try {
    //  You must validate the token. Right now, we'll assume it’s just a random string saved in DB.

    const [rows] = await db.execute("SELECT * FROM password_reset_tokens WHERE token = ?", [token]);

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const userId = rows[0].user_id;

    const hashed = await bcrypt.hash(password, 10);

    await db.execute("UPDATE users SET password_hash = ? WHERE id = ?", [hashed, userId]);

    // Clean up the token
    await db.execute("DELETE FROM password_reset_tokens WHERE token = ?", [token]);

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get('/me', auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, full_name, email, mobile FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(rows[0]); 
  } catch (error) {
    console.error('DB error in /me:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put("/me", auth, async (req, res) => {
  const userId = req.user.id;
  const { full_name, email, mobile } = req.body;

  try {
    await db.query(
      "UPDATE users SET full_name = ?, email = ?, mobile = ? WHERE id = ?",
      [full_name, email, mobile, userId]
    );
    const [updatedUser] = await db.query("SELECT id, full_name, email, mobile FROM users WHERE id = ?", [userId]);
    res.json(updatedUser[0]);
  } catch (err) {
    console.error("Failed to update user", err);
    res.status(500).json({ message: "Failed to update user" });
  }
});


app.post("/post-address", auth, async (req, res) => {
  const userId = req.user.id;
  const { name, street, city, state, pincode } = req.body;

  if (!name || !street || !city || !state || !pincode) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    await db.query(
      `INSERT INTO addresses (user_id, name, street, city, state, pincode)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name, street, city, state, pincode]
    );
    res.status(201).json({ message: "Address added" });
  } catch (err) {
    console.error("Error adding address:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
// GET /api/address
app.get("/addresses", auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT id, name, street, city, state, pincode, created_at
       FROM addresses
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json({ addresses: rows });
  } catch (err) {
    console.error("Error fetching addresses:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /address/:id
app.get("/address/:id", auth, async (req, res) => {
  const userId = req.user.id;
  const addressId = req.params.id;

  try {
    const [rows] = await db.query(
      `SELECT id, name, street, city, state, pincode
       FROM addresses
       WHERE id = ? AND user_id = ?`,
      [addressId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ address: rows[0] });
  } catch (error) {
    console.error("Error fetching address:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /address/:id
app.put("/address/:id", auth, async (req, res) => {
  const userId = req.user.id;
  const addressId = req.params.id;
  const { name, street, city, state, pincode } = req.body;

  if (!name || !street || !city || !state || !pincode) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [result] = await db.query(
      `UPDATE addresses
       SET name = ?, street = ?, city = ?, state = ?, pincode = ?
       WHERE id = ? AND user_id = ?`,
      [name, street, city, state, pincode, addressId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Address not found or not authorized" });
    }

    res.status(200).json({ message: "Address updated successfully" });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Server error" });
  }
});


app.delete("/addresses/:id", auth, async (req, res) => {
  const addressId = req.params.id;
  const userId = req.user.id;

  try {
    const [result] = await db.query(
      `DELETE FROM addresses WHERE id = ? AND user_id = ?`,
      [addressId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ message: "Address deleted" });
  } catch (err) {
    console.error("Error deleting address:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/add-product", upload.array("images", 5), async (req, res) => {
  const { name, price, original_price, description, stock, category } = req.body;
  const imageUrls = req.files.map(file => file.path);

  try {
    const [result] = await db.query(
      `INSERT INTO products (name, price, original_price, description, stock, category)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, price, original_price || null, description, stock, category || null]
    );

    const productId = result.insertId;

    for (const url of imageUrls) {
      await db.query(`INSERT INTO product_images (product_id, image_url) VALUES (?, ?)`, [
        productId,
        url,
      ]);
    }

    res.status(201).json({ message: "Product added successfully!" });
  } catch (err) {
    console.error("Add product error:", err);
    res.status(500).json({ message: "Something went wrong" });
  }
});




// GET /products?search=term
app.get("/products", async (req, res) => {
  const search = req.query.search || "";

  try {
    const [rows] = await db.query(
      `SELECT 
         p.*, 
         (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) AS image_url
       FROM products p
       WHERE p.name LIKE ? OR p.category LIKE ?
       ORDER BY p.created_at DESC`,
      [`%${search}%`, `%${search}%`]
    );

    res.status(200).json({ products: rows });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Error fetching products" });
  }
});



// GET /product/:id
app.get("/product/:id", async (req, res) => {
  const productId = req.params.id;

  try {
    const [[product]] = await db.query(
      `SELECT * FROM products WHERE id = ?`,
      [productId]
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const [images] = await db.query(
      `SELECT image_url FROM product_images WHERE product_id = ?`,
      [productId]
    );

    product.images = images.map(img => img.image_url);

    res.status(200).json({ product });
  } catch (err) {
    res.status(500).json({ message: "Error fetching product" });
  }
});


app.post('/add-to-cart', auth, async (req, res) => {
  const userId = req.user.id;
  const { product_id, quantity = 1 } = req.body;

  try {
    // check if product already in cart
    const [existing] = await db.query(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );

    if (existing.length > 0) {
      // update quantity
      await db.query(
        'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
        [quantity, userId, product_id]
      );
    } else {
      // insert new item
      await db.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, product_id, quantity]
      );
    }

    res.json({ success: true, message: 'Added to cart' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// routes/cart.js
app.get('/cart', auth, async (req, res) => {
  console.log("User from token:", req.user); // 👈 check if this prints

  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized - no user ID" });
  }

  try {
const [items] = await db.query(
  `SELECT 
     ci.id AS cart_item_id,
     ci.quantity,
     p.id AS product_id,
     p.name,
     p.price,
     (
       SELECT image_url 
       FROM product_images 
       WHERE product_id = p.id 
       LIMIT 1
     ) AS image_url
   FROM cart_items ci
   JOIN products p ON ci.product_id = p.id
   WHERE ci.user_id = ?`,
  [userId]
);


    console.log("Fetched items:", items);
    res.json({ success: true, items });
  } catch (err) {
    console.error("Cart DB query failed:", err);
    res.status(500).json({ success: false, error: "Could not fetch cart items" });
  }
});


app.delete('/cart/:cartItemId', auth, async (req, res) => {
  const userId = req.user.id;
  const cartItemId = req.params.cartItemId;

  try {
    const [result] = await db.query(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [cartItemId, userId]
    );

    res.json({ success: true, message: 'Item removed from cart' });
  } catch (err) {
    console.error("Error deleting cart item:", err);
    res.status(500).json({ success: false, error: 'Could not delete item' });
  }
});

function requireRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  const missingVariables = [];

  if (!keyId) missingVariables.push("RAZORPAY_KEY_ID");
  if (!keySecret) missingVariables.push("RAZORPAY_KEY_SECRET");

  if (missingVariables.length > 0) {
    console.error(
      `Razorpay configuration missing: ${missingVariables.join(", ")}`
    );
    const error = new Error(
      `Online payment configuration is missing: ${missingVariables.join(", ")}.`
    );
    error.statusCode = 503;
    throw error;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

function sendCheckoutError(res, error, fallbackMessage) {
  console.error(fallbackMessage, error);
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? fallbackMessage : error.message,
  });
}

app.post("/place-order", auth, async (req, res) => {
  const userId = req.user.id;
  const { address_id, payment_method, items, source = "buy_now" } = req.body;

  if (!address_id || !payment_method || !items?.length) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (payment_method !== "COD") {
    return res.status(400).json({
      message: "Use the Razorpay payment flow for online payments.",
    });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const normalizedItems = normalizeCheckoutItems(items);

    await assertAddressOwnership(connection, address_id, userId);
    const checkoutItems = await loadCheckoutProducts(
      connection,
      normalizedItems,
      true
    );
    const totalPaise = calculateTotalPaise(checkoutItems);
    const total = (totalPaise / 100).toFixed(2);

    const [orderResult] = await connection.query(
      `INSERT INTO orders
         (user_id, address_id, total_amount, payment_method, payment_status, status)
       VALUES (?, ?, ?, 'COD', 'Pending', 'Placed')`,
      [userId, address_id, total]
    );

    const orderId = orderResult.insertId;
    const itemValues = checkoutItems.map((item) => [
      orderId,
      item.product_id,
      item.quantity,
      item.unit_price,
    ]);

    await connection.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price)
       VALUES ?`,
      [itemValues]
    );
    await reserveStock(connection, checkoutItems);

    if (source === "cart") {
      const productIds = checkoutItems.map((item) => item.product_id);
      const placeholders = productIds.map(() => "?").join(", ");
      await connection.query(
        `DELETE FROM cart_items
         WHERE user_id = ? AND product_id IN (${placeholders})`,
        [userId, ...productIds]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      order_id: orderId,
      message: "Cash on Delivery order placed successfully.",
    });
  } catch (err) {
    await connection.rollback();
    sendCheckoutError(res, err, "Failed to place order.");
  } finally {
    connection.release();
  }
});

app.post("/payments/create-order", auth, async (req, res) => {
  const userId = req.user.id;
  const { address_id, items, source = "buy_now" } = req.body;

  if (!address_id || !items?.length) {
    return res.status(400).json({ message: "Address and products are required." });
  }

  if (!["buy_now", "cart"].includes(source)) {
    return res.status(400).json({ message: "Invalid checkout source." });
  }

  const connection = await db.getConnection();

  try {
    const razorpayClient = requireRazorpay();
    await connection.beginTransaction();

    const normalizedItems = normalizeCheckoutItems(items);
    await assertAddressOwnership(connection, address_id, userId);
    const checkoutItems = await loadCheckoutProducts(
      connection,
      normalizedItems,
      true
    );
    const totalPaise = calculateTotalPaise(checkoutItems);
    const total = (totalPaise / 100).toFixed(2);

    const [orderResult] = await connection.query(
      `INSERT INTO orders
         (user_id, address_id, total_amount, payment_method, payment_status, status)
       VALUES (?, ?, ?, 'Razorpay', 'Pending', 'Placed')`,
      [userId, address_id, total]
    );

    const orderId = orderResult.insertId;
    const itemValues = checkoutItems.map((item) => [
      orderId,
      item.product_id,
      item.quantity,
      item.unit_price,
    ]);

    await connection.query(
      `INSERT INTO order_items (order_id, product_id, quantity, price)
       VALUES ?`,
      [itemValues]
    );
    await reserveStock(connection, checkoutItems);

    const razorpayOrder = await razorpayClient.orders.create({
      amount: totalPaise,
      currency: "INR",
      receipt: `shopzi_${orderId}_${Date.now()}`.slice(0, 40),
      notes: {
        shopzi_order_id: String(orderId),
        user_id: String(userId),
        checkout_source: source,
      },
    });

    await connection.query(
      `INSERT INTO payments
         (order_id, razorpay_order_id, amount, currency, status)
       VALUES (?, ?, ?, ?, 'Created')`,
      [orderId, razorpayOrder.id, total, razorpayOrder.currency]
    );

    const [[user]] = await connection.query(
      "SELECT full_name, email, mobile FROM users WHERE id = ? LIMIT 1",
      [userId]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      key_id: process.env.RAZORPAY_KEY_ID.trim(),
      shopzi_order_id: orderId,
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      prefill: {
        name: user?.full_name || req.user.full_name || "",
        email: user?.email || req.user.email || "",
        contact: user?.mobile || "",
      },
    });
  } catch (err) {
    await connection.rollback();
    sendCheckoutError(res, err, "Could not start online payment.");
  } finally {
    connection.release();
  }
});

app.post("/payments/verify", auth, async (req, res) => {
  const userId = req.user.id;
  const {
    shopzi_order_id,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (
    !shopzi_order_id ||
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ) {
    return res.status(400).json({ message: "Payment verification data is missing." });
  }

  try {
    const razorpayClient = requireRazorpay();
    const [[paymentRecord]] = await db.query(
      `SELECT
         p.order_id,
         p.razorpay_order_id,
         p.razorpay_payment_id,
         p.amount,
         p.status,
         o.user_id
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       WHERE p.order_id = ? AND o.user_id = ?
       LIMIT 1`,
      [shopzi_order_id, userId]
    );

    if (!paymentRecord) {
      return res.status(404).json({ message: "Payment order was not found." });
    }

    if (paymentRecord.razorpay_order_id !== razorpay_order_id) {
      return res.status(400).json({ message: "Payment order does not match." });
    }

    const signatureIsValid = verifyRazorpaySignature({
      razorpayOrderId: paymentRecord.razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      keySecret: process.env.RAZORPAY_KEY_SECRET.trim(),
    });

    if (!signatureIsValid) {
      return res.status(400).json({ message: "Payment signature verification failed." });
    }

    const [razorpayPayment, razorpayOrder] = await Promise.all([
      razorpayClient.payments.fetch(razorpay_payment_id),
      razorpayClient.orders.fetch(paymentRecord.razorpay_order_id),
    ]);
    const expectedAmount = Math.round(Number(paymentRecord.amount) * 100);

    if (
      razorpayPayment.order_id !== paymentRecord.razorpay_order_id ||
      Number(razorpayPayment.amount) !== expectedAmount ||
      razorpayPayment.currency !== "INR" ||
      razorpayPayment.status !== "captured"
    ) {
      return res.status(409).json({
        message: "Payment is not captured yet. Please check again shortly.",
      });
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [[lockedPayment]] = await connection.query(
        `SELECT p.status, p.razorpay_payment_id
         FROM payments p
         JOIN orders o ON o.id = p.order_id
         WHERE p.order_id = ? AND o.user_id = ?
         FOR UPDATE`,
        [shopzi_order_id, userId]
      );

      if (!lockedPayment) {
        const error = new Error("Payment order was not found.");
        error.statusCode = 404;
        throw error;
      }

      if (lockedPayment.status === "Paid") {
        if (lockedPayment.razorpay_payment_id !== razorpay_payment_id) {
          const error = new Error("This order has already been paid.");
          error.statusCode = 409;
          throw error;
        }

        await connection.commit();
        return res.json({
          success: true,
          order_id: Number(shopzi_order_id),
          message: "Payment was already verified.",
        });
      }

      if (lockedPayment.status !== "Created") {
        const error = new Error("This payment order is no longer active.");
        error.statusCode = 409;
        throw error;
      }

      await connection.query(
        `UPDATE payments
         SET razorpay_payment_id = ?,
             status = 'Paid',
             payment_method = ?,
             failure_reason = NULL
         WHERE order_id = ?`,
        [
          razorpay_payment_id,
          razorpayPayment.method || "Razorpay",
          shopzi_order_id,
        ]
      );
      await connection.query(
        `UPDATE orders
         SET payment_status = 'Paid', status = 'Placed'
         WHERE id = ? AND user_id = ?`,
        [shopzi_order_id, userId]
      );

      if (razorpayOrder.notes?.checkout_source === "cart") {
        const [orderItems] = await connection.query(
          "SELECT product_id FROM order_items WHERE order_id = ?",
          [shopzi_order_id]
        );
        const productIds = orderItems.map((item) => item.product_id);

        if (productIds.length > 0) {
          const placeholders = productIds.map(() => "?").join(", ");
          await connection.query(
            `DELETE FROM cart_items
             WHERE user_id = ? AND product_id IN (${placeholders})`,
            [userId, ...productIds]
          );
        }
      }

      await connection.commit();

      res.json({
        success: true,
        order_id: Number(shopzi_order_id),
        message: "Payment verified and order placed successfully.",
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    sendCheckoutError(res, err, "Could not verify payment.");
  }
});

app.post("/payments/cancel", auth, async (req, res) => {
  const userId = req.user.id;
  const { shopzi_order_id, reason = "Payment window closed by customer." } = req.body;

  if (!shopzi_order_id) {
    return res.status(400).json({ message: "Order ID is required." });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [[paymentRecord]] = await connection.query(
      `SELECT p.status
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       WHERE p.order_id = ? AND o.user_id = ?
       FOR UPDATE`,
      [shopzi_order_id, userId]
    );

    if (!paymentRecord) {
      const error = new Error("Payment order was not found.");
      error.statusCode = 404;
      throw error;
    }

    if (paymentRecord.status === "Paid") {
      const error = new Error("A successful payment cannot be cancelled here.");
      error.statusCode = 409;
      throw error;
    }

    if (paymentRecord.status === "Created") {
      await restoreOrderStock(connection, shopzi_order_id);
      await connection.query(
        `UPDATE payments
         SET status = 'Failed', failure_reason = ?
         WHERE order_id = ?`,
        [String(reason).slice(0, 255), shopzi_order_id]
      );
      await connection.query(
        `UPDATE orders
         SET payment_status = 'Failed', status = 'Cancelled'
         WHERE id = ? AND user_id = ?`,
        [shopzi_order_id, userId]
      );
    }

    await connection.commit();
    res.json({ success: true, message: "Pending payment was cancelled." });
  } catch (err) {
    await connection.rollback();
    sendCheckoutError(res, err, "Could not cancel pending payment.");
  } finally {
    connection.release();
  }
});



// GET /orders
app.get("/orders", auth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [orders] = await db.query(
      `
      SELECT 
        o.id AS order_id,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.status,
        o.created_at,
        a.name AS address_name,
        a.street,
        a.city,
        a.state,
        a.pincode,
        oi.product_id, oi.quantity, oi.price,
        p.name AS product_name,
        COALESCE(pi.image_url, '') AS image_url
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      JOIN addresses a ON o.address_id = a.id
      LEFT JOIN (
        SELECT product_id, MIN(image_url) AS image_url
        FROM product_images
        GROUP BY product_id
      ) pi ON pi.product_id = p.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `,
      [userId]
    );

    const grouped = {};
    for (let row of orders) {
      if (!grouped[row.order_id]) {
        grouped[row.order_id] = {
          id: row.order_id,
          total_amount: row.total_amount,
          payment_method: row.payment_method,
          payment_status: row.payment_status,
          status: row.status,
          created_at: row.created_at,
          address_name: row.address_name,
          street: row.street,
          city: row.city,
          state: row.state,
          pincode: row.pincode,
          items: [],
        };
      }
      grouped[row.order_id].items.push({
        product_id: row.product_id,
        name: row.product_name,
        quantity: row.quantity,
        price: row.price,
        image_url: row.image_url,
      });
    }

    res.json({ orders: Object.values(grouped) });
  } catch (err) {
    console.error("Failed to fetch orders:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



// DELETE /orders/:orderId
app.delete("/orders/:orderId", auth, async (req, res) => {
  const userId = req.user.id;
  const orderId = req.params.orderId;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [[order]] = await connection.query(
      `SELECT id, payment_method, payment_status, status
       FROM orders
       WHERE id = ? AND user_id = ?
       FOR UPDATE`,
      [orderId, userId]
    );

    if (!order || order.status !== "Placed") {
      const error = new Error("Order not found or not cancellable.");
      error.statusCode = 404;
      throw error;
    }

    if (order.payment_method === "Razorpay" && order.payment_status === "Paid") {
      const error = new Error(
        "Online-payment cancellation requires a refund and is not available yet."
      );
      error.statusCode = 409;
      throw error;
    }

    await restoreOrderStock(connection, orderId);
    await connection.query(
      `UPDATE orders
       SET status = 'Cancelled'
       WHERE id = ? AND user_id = ?`,
      [orderId, userId]
    );
    await connection.commit();

    res.json({ message: "Order cancelled successfully" });
  } catch (err) {
    await connection.rollback();
    sendCheckoutError(res, err, "Failed to cancel order.");
  } finally {
    connection.release();
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // or 'strict' depending on your frontend-backend setup
  });
  return res.status(200).json({ message: "Logged out successfully" });
});


app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
    console.log("Razorpay environment:", {
      keyIdPresent: Boolean(process.env.RAZORPAY_KEY_ID?.trim()),
      keySecretPresent: Boolean(process.env.RAZORPAY_KEY_SECRET?.trim()),
    });
})

