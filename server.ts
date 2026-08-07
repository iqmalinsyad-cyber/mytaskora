import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI Copilot / Assistant Route using Gemini
  app.post("/api/ai/copilot", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(200).json({
          reply: "Perhatian: Kunci GEMINI_API_KEY tidak dikonfigurasikan. Mod demonstrasi AI aktif. Sila tetapkan kuncinya di Tetapan Secrets untuk jawapan AI secara langsung.",
          status: "fallback"
        });
      }

      const { message, context } = req.body;
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Anda adalah Pembantu AI Copilot untuk "Sistem Workspace Aduan Nova AI". 
Anda pakar dalam tatacara pengurusan aduan awam & organisasi, analisis kes, penyediaan minit/catatan siasatan, dan draf maklum balas rasmi dalam Bahasa Melayu.

Konteks Sistem & Aduan Semasa:
${JSON.stringify(context || {}, null, 2)}

Soalan / Arahan Pengguna:
"${message}"

Sila berikan jawapan yang profesional, ringkas, berstruktur (gunakan bullet point atau format kemas jika sesuai) dan dalam Bahasa Melayu secara mesra perkhidmatan awam/korporat.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const replyText = response.text || "Tiada maklum balas daripada model AI.";
      return res.json({ reply: replyText, status: "success" });
    } catch (error: any) {
      console.error("AI Copilot error:", error);
      return res.status(500).json({
        error: "Gagal memproses permintaan AI Copilot.",
        details: error?.message || String(error)
      });
    }
  });

  // Draft Response Letter / Draft Note Template using Gemini
  app.post("/api/ai/draft-response", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const { aduanCase, formatType } = req.body;

      if (!apiKey) {
        const sampleDraft = `RUJUKAN: ${aduanCase?.noRujukan || 'ADV-2026-001'}
TARIKH: ${new Date().toLocaleDateString('ms-MY')}
KEPADA: ${aduanCase?.namaPengadu || 'Pengadu'}

TUAN / PUAN,

MAKLUM BALAS KES ADUAN: ${aduanCase?.tajuk || 'Aduan Awam'}

Merujuk kepada aduan tuan/puan berkenaan perkara di atas, pihak kami ingin memaklumkan bahawa tindakan siasatan/penyelesaian telah dijalankan oleh unit bertugas.

STATUS KES: ${aduanCase?.status || 'Selesai'}
RINGKASAN TINDAKAN: ${aduanCase?.penerangan || 'Siasatan tapak dan tindakan perbetulan telah dilaksanakan mengikut SOP.'}

Pihak kami mengandaikan kes aduan ini telah diselesaikan dengan sempurna. Terima kasih atas kerjasama tuan/puan.

Sekian, terima kasih.

"BERKHIDMAT UNTUK NEGARA"
${aduanCase?.assignee || 'Pegawai Aduan Workspace'}`;

        return res.json({ draft: sampleDraft, isFallback: true });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Jana satu draf ${formatType || 'surat maklum balas rasmi'} untuk kes aduan berikut:
Rujukan: ${aduanCase?.noRujukan}
Tajuk: ${aduanCase?.tajuk}
Kategori: ${aduanCase?.kategori}
Pengadu: ${aduanCase?.namaPengadu} (${aduanCase?.emailPengadu || 'N/A'})
Status: ${aduanCase?.status}
Penerangan Aduan: ${aduanCase?.penerangan}
Nota/Catatan Siasatan: ${JSON.stringify(aduanCase?.catatan || [])}

Sila pastikan bahasa yang digunakan adalah Bahasa Melayu tinggi, rasmi, sopan, dan berstruktur lengkap (rujukan, tarikh, perenggan pembuka, ringkasan tindakan, perenggan penutup).`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return res.json({ draft: response.text, isFallback: false });
    } catch (error: any) {
      console.error("Draft generation error:", error);
      return res.status(500).json({ error: "Gagal menjana draf AI." });
    }
  });

  // Serve Vite in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
