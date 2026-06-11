# 🛍️ Shopzi – Full Stack E-Commerce Platform

[![Live Site](https://img.shields.io/badge/Live_Site-Shopzi-blue?style=flat-square&logo=vercel&logoColor=white)](https://shopzi-umber.vercel.app/)

**Shopzi** is a full-stack e-commerce web application developed as a **Database Management Systems (DBMS)** project. It features a robust backend, a modern responsive frontend, and a normalized relational database.

---

## Video Demo

[![Watch the Shopzi project demo](https://i.ytimg.com/vi/MBXX_hnYvaA/maxresdefault.jpg)](https://youtu.be/MBXX_hnYvaA)

[Watch the complete Shopzi project walkthrough on YouTube](https://youtu.be/MBXX_hnYvaA)

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Tailwind CSS  
- **Backend:** Node.js, Express.js  
- **Database:** MySQL (hosted on Railway)  
- **Image Storage:** Cloudinary  
- **Authentication:** JWT-based auth  
- **Hosting:** Vercel (frontend), Render (backend)

---

## ✨ Features

- ✅ User signup, login, JWT auth  
- 🛒 Product listing with categories and image gallery  
- 🧺 Cart, address management, and checkout  
- 📦 Order history and tracking  
- 🖼️ Image uploads using Cloudinary  
- 📱 Fully responsive UI for mobile and desktop  
- 🔗 Database relationships via foreign keys and constraints

---

## 🗃️ Database Design Highlights

The MySQL schema is fully normalized and includes:

- `users`, `products`, `product_images`  
- `cart_items`, `orders`, `order_items`  
- `addresses` (linked via foreign key to users)  
- `password_reset_tokens`  

Supports referential integrity and cascading deletes where needed.

---

## 🌐 Live Demo

👉 **Frontend**: [https://shopzi-umber.vercel.app/](https://shopzi-umber.vercel.app/)

---

## 📌 Note

This project was created as part of the **DBMS course project**, demonstrating full-stack integration, secure backend practices, and relational database design.

---

