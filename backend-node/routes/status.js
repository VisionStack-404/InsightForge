const express = require("express");
const router = express.Router();
const redis = require("../redis");

router.get("/:jobId", async (req, res) => {
  const job = await redis.hgetall(`job:${req.params.jobId}`);

  if (!job || !job.status) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json(job);
});

module.exports = router;
