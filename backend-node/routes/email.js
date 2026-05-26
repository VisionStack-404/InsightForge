const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.post("/welcome", async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    let transporter;
    
    // Auto-detect production settings or use a simulator
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      let testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log("No SMTP settings in .env. Using simulated Ethereal account.");
    }

    // Fire-and-forget: we don't await this so the UI responds instantly!
    transporter.sendMail({
      from: '"InsightForge" <welcome@insightforge.com>',
      to: email,
      subject: "Welcome to InsightForge - Your AI Reading Assistant!",
      text: `Hello ${name || 'User'},\n\nWelcome to InsightForge! We are thrilled to have you on board. Our engine relies on Llama 3.1 AI to instantly summarize web pages and Redis caching to deliver sub-50ms repeat loads.\n\nWe will also be sending you daily progress reports of your activity.\n\nBest,\nVarun`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to InsightForge, ${name || 'User'}! 🚀</h2>
          <p>We are thrilled to have you on board. InsightForge isn't just a bookmarking tool—it's a high-performance AI engine designed to save you hours of reading time every week.</p>
          
          <h3>How It Works</h3>
          <p>Whenever you paste a link into InsightForge, our system instantly scrapes the page, strips away all the clutter and ads, and feeds the pure content directly into our <b>Llama 3.1 AI model</b>. The AI extracts the core essence, generates a concise summary, identifies key takeaways, and automatically tags the article with topics.</p>
          
          <h3>Unmatched Performance</h3>
          <p>We focus heavily on speed. By utilizing an advanced <b>Redis caching layer</b>, any link that has been optimized by anyone on InsightForge is instantly available to you. Cache hits load in less than 50 milliseconds! For new links, our background Celery workers process the AI inference asynchronously so your UI never freezes.</p>
          
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p>We will keep you updated with your daily progress and activity reports right here in your inbox.</p>
          <p>Enjoy extracting clarity from the web!<br><br>Best,<br><b>Varun</b></p>
        </div>
      `
    }).then(info => {
      console.log("Message sent: %s", info.messageId);
      if (!process.env.SMTP_HOST) console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }).catch(error => {
      console.error("Email send error:", error);
    });

    res.json({ success: true, message: "Email queued asynchronously" });
  } catch (error) {
    console.error("Transporter init error:", error);
    res.status(500).json({ error: "Failed to configure email queue" });
  }
});

// Daily Activity Report Route
router.post("/report", async (req, res) => {
  const { email, name, stats, recentLinks } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    let transporter;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
    } else {
      let testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email", port: 587, secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    }

    let linksHtml = (recentLinks || []).map(link => {
      const summaryText = link.summary ? `<div style="background: #f8fafc; padding: 12px 16px; margin-top: 8px; border-left: 3px solid #0ea5e9; font-size: 14px; color: #475569; border-radius: 4px; white-space: pre-wrap;">${link.summary}</div>` : "";
      return `<li style="margin-bottom: 32px; list-style-type: none;">
        <a href="${link.url}" target="_blank" style="color: #0ea5e9; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">▶ ${link.title || link.url}</a>
        ${summaryText}
      </li>`;
    }).join("");
    
    if (!linksHtml) linksHtml = "<li style='list-style-type: none; color: #64748b;'>No links processed recently.</li>";

    // Fire-and-forget delivery so frontend doesn't hang!
    transporter.sendMail({
      from: '"InsightForge Reports" <reports@insightforge.com>',
      to: email,
      subject: `Your Daily InsightForge Activity Report 📊`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px;">
          <h2 style="margin-top: 0; color: #0f172a;">Daily Progress Report</h2>
          <p>Hello <b>${name || 'User'}</b>,</p>
          <p>Here is your daily activity summary from InsightForge to help you track your learning habits!</p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 32px 0;">
            <h3 style="margin-top: 0; color: #0f172a;">Today's Learning Impact</h3>
            <ul style="margin-bottom: 0; list-style-type: none; padding-left: 0;">
              <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Total Links Processed:</strong> ${stats?.totalLinks || 0}</li>
              <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Words Digested by AI:</strong> ${stats?.wordsSummarized || 0} words</li>
              <li style="padding: 8px 0;"><strong>Est. Reading Time Saved:</strong> ${stats?.readTimeSaved || '0 mins'}</li>
            </ul>
          </div>

          <h3 style="margin-top: 32px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Recent Insights Analyzed</h3>
          <ul style="padding-left: 0;">
            ${linksHtml}
          </ul>
          
          <hr style="border: 1px solid #e2e8f0; margin: 32px 0 24px 0;">
          <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">You are receiving this summary because you enabled InsightForge reports to your Gmail account.</p>
        </div>
      `
    }).then(info => {
      console.log("Report sent: %s", info.messageId);
      if (!process.env.SMTP_HOST) console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }).catch(error => {
      console.error("Report send error:", error);
    });

    res.json({ success: true, message: "Report queued asynchronously" });
  } catch (error) {
    console.error("Transporter config error:", error);
    res.status(500).json({ error: "Failed to queue report" });
  }
});

module.exports = router;
