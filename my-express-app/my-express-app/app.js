const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 5000;

// Serve  frontend folder (note: folder name is `forntend` in the project)
app.use(express.static(path.join(__dirname, "forntend")));
// Parse JSON request bodies
app.use(express.json());

app.post("/summarise", async (req, res) => {
   try {
      const { url } = req.body || {};

      console.log("URL received from frontend:", url);

      if (!url) {
         return res.status(400).json({ status: "no-url", error: 'missing url in request body' });
      }

      // Defensive: if Summary of (DB model) isn't defined yet, skip DB lookup
      if (typeof Summary !== 'undefined' && Summary && typeof Summary.findOne === 'function') {
         const existing = await Summary.findOne({ url });
         if (existing) {
            return res.json({ status: 'done', summary: existing.summary });
         }
      }

      // Defensive: if the  redisClient exists, push job; otherwise skip and return processing
      if (typeof redisClient !== 'undefined' && redisClient && typeof redisClient.lPush === 'function') {
         await redisClient.lPush('summary_jobs', url);
         return res.json({ status: 'processing', message: 'Summary is being generated...' });
      }

      // Fallback: mocked response so the frontend gets valid JSON while pipeline is missing
      const mockedSummary = `Mocked summary for ${url}`;
      return res.json({ status: 'done', summary: mockedSummary });
   } catch (err) {
      console.error('Error in /summarise:', err && err.stack ? err.stack : err);
      return res.status(500).json({ error: 'internal server error', message: err && err.message });
   }
});



app.listen(PORT, () => {
   console.log("Server running on http://localhost:" + PORT);
});
