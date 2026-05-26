const mongoose = require("mongoose");

const ArticleSchema = new mongoose.Schema({
  url: String,
  status: String,
  summary: String,
  topics: [String]
}, { timestamps: true });

module.exports = mongoose.model("Article", ArticleSchema);
