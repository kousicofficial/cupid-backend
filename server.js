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
app.use((req, res, next) => {
  res.setTimeout(120000); // 2 minutes
  next();
});

app.use(cors({ origin: "*" }));

app.use(express.json());

/* =====================
   MONGODB
===================== */
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ Mongo Error:", err));

/* =====================
   CLOUDINARY
===================== */
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

/* =====================
   STORAGE
===================== */
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "cupid",
    resource_type: "auto",
  },
});


const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

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
      console.log("FILES:", req.files);
      console.log("BODY:", req.body);

      const { name, message, password } = req.body;

      if (!name || !message || !req.files?.photo) {
        return res.status(400).json({
          message: "Name, Message, Photo required",
        });
      }

      const love = await Love.create({
        name,
        message,
        password: password || "",

        photo: req.files.photo[0].path,

        songs: req.files.songs ? req.files.songs.map((f) => f.path) : [],
      });

      res.status(201).json({ id: love._id });
    } catch (err) {
      console.error("CREATE ERROR ❌", err.stack || err);

      return res.status(500).json({
        message: err.message || "Internal Server Error",
      });
    }
  },
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
    console.error("FETCH ERROR:", err);

    res.status(500).json({
      message: "Server error",
    });
  }
});

/* =====================
   START
===================== */
const PORT = process.env.PORT || 4000;

const http = require("http");

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});

