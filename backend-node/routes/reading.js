const express = require("express");
const router = express.Router();
const pythonApi = require("../services/pythonApi");

// Submit URL
router.post("/submit", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const data = await pythonApi.enqueueUrl(url);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check status
router.get("/status/:jobId", async (req, res) => {
  try {
    const data = await pythonApi.getStatus(req.params.jobId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get result
router.get("/result/:jobId", async (req, res) => {
  try {
    const data = await pythonApi.getResult(req.params.jobId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
