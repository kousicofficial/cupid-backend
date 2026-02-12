const mongoose = require("mongoose");

const loveSchema = new mongoose.Schema(
  {
    name: String,
    message: String,
    password: String,

    photo: String,
    songs: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Love", loveSchema);
