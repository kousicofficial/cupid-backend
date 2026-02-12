const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const Love = require("./models/Love");

const app = express();

/* =====================
   MIDDLEWARE
===================== */
app.use(cors({ origin: "*" }));
app.use(express.json());

/* =====================
   MONGODB
===================== */
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("Mongo Error:", err));

/* =====================
   CLOUDINARY
===================== */
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

/* =====================
   STORAGE (CLOUDINARY)
===================== */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "cupid",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "mp3"],
    resource_type: "auto",
  },
});

const upload = multer({ storage });

/* =====================
   CREATE LOVE PAGE
===================== */
app.post(
  "/api/create",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "songs", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const { name, message, password } = req.body;

      if (!name || !message || !req.files?.photo) {
        return res.status(400).json({
          message: "Name, Message and Photo required",
        });
      }

      // ✅ IMPORTANT FIX: use secure_url
      const photoUrl = req.files.photo[0].secure_url;

      const songUrls = req.files.songs
        ? req.files.songs.map((f) => f.secure_url)
        : [];

      const love = await Love.create({
        name,
        message,
        password: password || "",
        photo: photoUrl,      // ✅ Cloudinary URL
        songs: songUrls,      // ✅ Cloudinary URLs
      });

      res.json({ id: love._id });

    } catch (err) {
      console.error("UPLOAD ERROR ❌", err);

      res.status(500).json({
        message: "Upload failed",
      });
    }
  }
);

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
   START SERVER
===================== */
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
