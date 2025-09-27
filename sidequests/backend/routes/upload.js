import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";

const upload = multer({ storage: multer.memoryStorage() });

export default function uploadRoutes(supabase) {
  const router = Router();

  // Upload event image
  router.post("/event-image/:eventId", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filename = `events/${req.params.eventId}-${randomUUID()}.jpg`;

    const { error } = await supabase.storage
      .from("uploads")
      .upload(filename, req.file.buffer, { contentType: req.file.mimetype });

    if (error) return res.status(400).json({ error: error.message });

    const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(filename);

    await supabase.from("events").update({ image_url: publicUrl }).eq("id", req.params.eventId);

    res.json({ url: publicUrl });
  });

  return router;
}