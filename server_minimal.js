const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const mongoUri = "mongodb://127.0.0.1:27017/signupDB";
mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log("[MongoDB] Connected"))
  .catch(err => console.error("[MongoDB] Error:", err.message));

// MINIMAL test route first
app.post("/api/users/sign-up", async (req, res) => {
  console.log("[signup] Received request");
  res.json({ message: "test works" });
});

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Server running" });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✓ Server listening on port ${PORT}`);
});
