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
app.use(express.json());
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
/* =====================
   CREATE LOVE PAGE (FIXED)
===================== */
app.post(
  "/api/create",

  // This parses multipart form fields
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "songs", maxCount: 5 },
  ]),

  async (req, res) => {
    try {
      // DEBUG (keep for now)
      console.log("FILES:", req.files);
      console.log("BODY:", req.body);

      // SAFE way to read body
      const name = req.body?.name;
      const message = req.body?.message;
      const password = req.body?.password || "";

      if (!name || !message || !req.files?.photo) {
        return res.status(400).json({
          message: "Name, Message, Photo required",
        });
      }

      const love = await Love.create({
        name,
        message,
        password,

        // Cloudinary URL
        photo: req.files.photo[0].path,

        // Song URLs
        songs: req.files.songs ? req.files.songs.map((f) => f.path) : [],
      });

      res.status(201).json({
        id: love._id,
      });
    } catch (err) {
      console.error("CREATE ERROR ❌", err);

      res.status(500).json({
        message: err.message || "Upload Failed",
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
