import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";

const upload = multer({ storage: multer.memoryStorage() });

// Helper function to replace localhost URLs with ngrok/public URL
function replaceLocalhostUrl(url) {
  // Check if there's a public URL environment variable (for ngrok)
  const publicUrl = process.env.SUPABASE_PUBLIC_URL || process.env.NGROK_URL;
  
  if (publicUrl && url.includes('localhost:54321')) {
    // Replace localhost:54321 with the public URL
    return url.replace(/http:\/\/localhost:54321/g, publicUrl);
  }
  
  return url;
}

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
    const finalUrl = replaceLocalhostUrl(publicUrl);

    await supabase.from("events").update({ image_url: finalUrl }).eq("id", req.params.eventId);

    res.json({ url: finalUrl });
  });

  // Upload diary photo
  router.post("/diary-photo/:eventId", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Validate file type
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: "File must be an image" });
      }

      // Get file extension from mimetype or use jpg as default
      const mimeTypeMap = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
      };
      const extension = mimeTypeMap[req.file.mimetype] || 'jpg';
      const filename = `diary/${req.params.eventId}-${randomUUID()}.${extension}`;

      const { error } = await supabase.storage
        .from("uploads")
        .upload(filename, req.file.buffer, { 
          contentType: req.file.mimetype,
          upsert: false // Don't overwrite existing files
        });

      if (error) {
        console.error("Supabase upload error:", error);
        console.error("Error details:", {
          message: error.message,
          statusCode: error.statusCode,
          error: error.error,
          bucket: 'uploads',
          filename: filename
        });
        
        // Provide helpful error messages
        if (error.message?.includes('Bucket') || error.message?.includes('not found')) {
          return res.status(400).json({ 
            error: "Storage bucket 'uploads' not found. Please create it in Supabase Storage settings.",
            details: error.message 
          });
        }
        
        return res.status(400).json({ error: error.message || "Failed to upload file" });
      }

      const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(filename);
      const finalUrl = replaceLocalhostUrl(publicUrl);

      res.json({ url: finalUrl });
    } catch (error) {
      console.error("Error uploading diary photo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}