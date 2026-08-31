require("dotenv").config();
const express = require("express");
const cors = require("cors");

const readingRoutes = require("./routes/reading");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", readingRoutes);

const emailRoutes = require("./routes/email");
app.use("/api/email", emailRoutes);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Node Gateway running on port ${PORT}`);
  });
}
module.exports = app;
