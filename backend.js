// server.js
import express from "express";
import axios from "axios";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// --- Setup ---
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Static Frontend ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Homepage (index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Prevent favicon.ico error in logs
app.get("/favicon.ico", (req, res) => res.status(204).end());

// --- Routes ---

// ✅ Translation (LibreTranslate → fallback Google Translate)
app.post("/translate", async (req, res) => {
  const { text } = req.body || {};
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Missing text for translation." });
  }

  // 1) Try LibreTranslate
  try {
    const libreResp = await axios.post(
      "https://de.libretranslate.com/translate",
      {
        q: text,
        source: "auto",
        target: "hi",
        format: "text",
      },
      { headers: { Accept: "application/json" }, timeout: 10000 }
    );

    if (libreResp.data?.translatedText) {
      return res.json({ translatedText: libreResp.data.translatedText });
    }
  } catch (err) {
    console.error("LibreTranslate error:", err?.response?.data || err.message);
  }

  // 2) Fallback: Google’s free web API
  try {
    const googleResp = await axios.get(
      "https://translate.googleapis.com/translate_a/single",
      {
        params: {
          client: "gtx",
          sl: "auto",
          tl: "hi",
          dt: "t",
          q: text,
        },
        timeout: 10000,
      }
    );

    const chunks = googleResp.data?.[0] || [];
    const translated = chunks.map((chunk) => chunk[0]).join("");
    if (translated) {
      return res.json({ translatedText: translated });
    }
  } catch (err) {
    console.error("Google Translate fallback error:", err?.message);
  }

  // 3) If everything fails
  return res.status(503).json({ error: "Translation service unavailable." });
});

// ✅ Dictionary
app.get("/meaning/:word", async (req, res) => {
  const { word } = req.params || {};
  if (!word) {
    return res.status(400).json({ error: "Missing word parameter." });
  }

  try {
    const response = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
        word
      )}`,
      { timeout: 10000 }
    );
    return res.json(response.data);
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: "Word meaning not found." });
    }
    console.error("Dictionary API error:", err?.message);
    return res.status(503).json({ error: "Dictionary service unavailable." });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
