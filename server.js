const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// =========================
// MIDDLEWARE
// =========================
app.use(cors());
app.use(express.json());

// =========================
// MONGODB CONNECTION
// =========================
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("MongoDB Error:", err));

// =========================
// SCHEMA
// =========================
const customerSchema = new mongoose.Schema({
  name: String,
  fatherName: String,
  balance: { type: Number, default: 0 },
  history: { type: Array, default: [] },
});

const Customer = mongoose.model("Customer", customerSchema);

// =========================
// GET ALL CUSTOMERS
// =========================
app.get("/customers", async (req, res) => {
  try {
    const data = await Customer.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// ADD / UPDATE TRANSACTION
// =========================
app.post("/customer", async (req, res) => {
  try {
    const { name, fatherName, amount, type } = req.body;

    let customer = await Customer.findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
      fatherName: { $regex: `^${fatherName.trim()}$`, $options: "i" },
    });

    if (!customer) {
      customer = new Customer({
        name,
        fatherName,
        balance: 0,
        history: [],
      });
    }

    if (type === "udhaar") {
      customer.balance += amount;
    } else {
      customer.balance -= amount;
    }

    customer.history.push({
      type,
      amount,
      date: new Date().toLocaleString(),
    });

    await customer.save();

    res.json({ message: "Saved successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// EDIT CUSTOMER
// =========================
app.put("/customer/:id", async (req, res) => {
  try {
    await Customer.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// ADJUST BALANCE (FIXED ROUTE)
// =========================
app.put("/adjust/:id", async (req, res) => {
  try {
    const { newBalance } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const difference = newBalance - customer.balance;

    customer.balance = newBalance;

    customer.history.push({
      type: "adjustment",
      amount: difference,
      date: new Date().toLocaleString(),
    });

    await customer.save();

    res.json({ message: "Balance updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// DELETE CUSTOMER
// =========================
app.delete("/customer/:id", async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// START SERVER
// =========================
app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${process.env.PORT}`);
});
const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const Admin = mongoose.model("Admin", adminSchema);

// =========================
// CREATE DEFAULT ADMIN (ONE TIME)
// =========================
Admin.findOne({ username: "admin" }).then((data) => {
  if (!data) {
    Admin.create({
      username: "admin",
      password: "1234",
    });
    console.log("🔥 Admin Created");
  }
});

// =========================
// ADMIN LOGIN API
// =========================
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username, password });

    if (!admin) {
      return res.status(401).json({ message: "Invalid admin login" });
    }

    res.json({ message: "Login success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
