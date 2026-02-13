const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Love = require("./models/Love");

const app = express();

/* =====================
   MIDDLEWARE
===================== */
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* =====================
   MONGODB
===================== */
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ Mongo Error:", err));

/* =====================
   CREATE LOVE PAGE
   (NO FILE UPLOAD HERE)
===================== */
app.post("/api/create", async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { name, message, password, photo, songs } = req.body;

    // Validation
    if (!name || !message || !photo) {
      return res.status(400).json({
        message: "Name, Message, Photo required",
      });
    }

    const love = await Love.create({
      name,
      message,
      password: password || "",
      photo,              // Cloudinary URL
      songs: songs || [], // Array of URLs
    });

    res.status(201).json({
      id: love._id,
    });
  } catch (err) {
    console.error("CREATE ERROR ❌", err);

    res.status(500).json({
      message: "Server error",
    });
  }
});

/* =====================
   GET LOVE PAGE
===================== */
app.get("/api/love/:id", async (req, res) => {
  try {
    const love = await Love.findById(req.params.id);

    if (!love) {
      return res.status(404).json({
        message: "Not found",
      });
    }

    res.json(love);
  } catch (err) {
    console.error("FETCH ERROR ❌", err);

    res.status(500).json({
      message: "Server error",
    });
  }
});

/* =====================
   ROOT TEST
===================== */
app.get("/", (req, res) => {
  res.send("Cupid Backend Running ❤️");
});

/* =====================
   START SERVER
===================== */
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
