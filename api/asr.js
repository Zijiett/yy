import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export const config = { api: { bodyParser: false } };

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  upload.single("file")(req, res, async (err) => {
    try {
      if (err) return res.status(400).send(String(err));
      if (!req.file) return res.status(400).send("No file");

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return res.status(500).send("Missing OPENAI_API_KEY");

      const form = new FormData();
      form.append("model", "gpt-4o-mini-transcribe");
      form.append(
        "file",
        new Blob([req.file.buffer], { type: req.file.mimetype || "audio/mp4" }),
        req.file.originalname || "speech.mp4"
      );

      const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });

      if (!resp.ok) {
        const t = await resp.text().catch(() => "");
        return res.status(500).send(`OpenAI error ${resp.status}: ${t}`);
      }

      const data = await resp.json();
      return res.status(200).json({ text: data.text || "" });
    } catch (e) {
      return res.status(500).send(e?.message || String(e));
    }
  });
}
