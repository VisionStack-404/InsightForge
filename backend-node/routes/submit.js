const express = require("express");
const axios = require("axios");
const router = express.Router();

router.post("/", async (req, res) => {
  const { url } = req.body;

  const response = await axios.post(
    "http://localhost:8000/enqueue",
    { url }
  );

  res.json(response.data);
});

module.exports = router;
