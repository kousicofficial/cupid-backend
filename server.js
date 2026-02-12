const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

/* =====================
   CRASH PROTECTION
===================== */
process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

const Love = require("./models/Love");

const app = express();

/* =====================
   CREATE UPLOAD FOLDER
===================== */
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

/* =====================
   MIDDLEWARE
===================== */
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

/* =====================
   MONGODB
===================== */
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ Mongo Error:", err);
    process.exit(1);
  });

/* =====================
   MULTER CONFIG
===================== */
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  },
});

/* FILE FILTER */
const fileFilter = (req, file, cb) => {

  if (file.fieldname === "photo") {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only images allowed"));
    }
  }

  if (file.fieldname === "songs") {
    if (!file.mimetype.startsWith("audio/")) {
      return cb(new Error("Only audio allowed"));
    }
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
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

      console.log("📂 Files:", req.files);
      console.log("📝 Body:", req.body);

      const { name, message, password } = req.body;

      /* VALIDATION */
      if (!name || !message) {
        return res.status(400).json({
          message: "Name and Message required",
        });
      }

      if (!req.files?.photo) {
        return res.status(400).json({
          message: "Photo is required",
        });
      }

      /* FILES */
      const photoFile = req.files.photo[0].filename;

      const songFiles = req.files.songs
        ? req.files.songs.map((f) => f.filename)
        : [];

      /* SAVE DB */
      const love = await Love.create({
        name,
        message,
        password: password || "",

        photo: photoFile,
        songs: songFiles,
      });

      console.log("❤️ Created:", love._id);

      res.status(201).json({
        id: love._id,
        message: "Love page created 💖",
      });

    } catch (err) {

      console.error("UPLOAD ERROR ❌", err);

      res.status(500).json({
        message: err.message || "Upload Failed",
      });
    }
  }
);

/* =====================
   GET LOVE PAGE (SAFE)
===================== */
app.get("/api/love/:id", async (req, res) => {
  try {

    const { id } = req.params;

    /* VALIDATE ID */
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid ID",
      });
    }

    const love = await Love.findById(id);

    if (!love) {
      return res.status(404).json({
        message: "Page Not Found",
      });
    }

    res.json(love);

  } catch (err) {

    console.error("FETCH ERROR ❌", err);

    res.status(500).json({
      message: "Server Error",
    });
  }
});

/* =====================
   HEALTH CHECK
===================== */
app.get("/", (req, res) => {
  res.send("💘 CUPID API Running");
});

/* =====================
   START SERVER
===================== */
const PORT = 4000; // NEW PORT

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running on http://0.0.0.0:${PORT}`);
});
