import { Router } from "express";

export default function wishlistRoutes(supabase) {
  const router = Router();

  // Get user's wishlist
  router.get("/:userId", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("wishlist")
        .select("*")
        .eq("user_id", req.params.userId)
        .order("created_at", { ascending: false });

      if (error) return res.status(400).json({ error: error.message });
      res.json(data || []);
    } catch (e) {
      res.status(500).json({ error: "Failed to load wishlist" });
    }
  });

  // Add location to wishlist
  router.post("/", async (req, res) => {
    try {
      const { user_id, name, latitude, longitude, note } = req.body;

      if (!user_id || !name || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: "Missing required fields: user_id, name, latitude, longitude" });
      }

      const { data, error } = await supabase
        .from("wishlist")
        .insert([{ user_id, name, latitude, longitude, note }])
        .select()
        .single();

      if (error) return res.status(400).json({ error: error.message });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Failed to add to wishlist" });
    }
  });

  // Update wishlist item
  router.put("/:id", async (req, res) => {
    try {
      const { name, note } = req.body;

      const updates = {};
      if (name !== undefined) updates.name = name;
      if (note !== undefined) updates.note = note;

      const { data, error } = await supabase
        .from("wishlist")
        .update(updates)
        .eq("id", req.params.id)
        .select()
        .single();

      if (error) return res.status(400).json({ error: error.message });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Failed to update wishlist item" });
    }
  });

  // Delete wishlist item
  router.delete("/:id", async (req, res) => {
    try {
      const { error } = await supabase
        .from("wishlist")
        .delete()
        .eq("id", req.params.id);

      if (error) return res.status(400).json({ error: error.message });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete wishlist item" });
    }
  });

  return router;
}

