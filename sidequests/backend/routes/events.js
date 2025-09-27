import { Router } from "express";

export default function eventRoutes(supabase) {
  const router = Router();
  
  // Create event
  router.post("/", async (req, res) => {
    const { title, date, type, user_id, latitude, longitude } = req.body;

    const { data, error } = await supabase
      .from("events")
      .insert([{ title, date, type, user_id, latitude, longitude }]);

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  // Get events
  router.get("/", async (req, res) => {
    const { data, error } = await supabase.from("events").select("*");
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  return router;
}