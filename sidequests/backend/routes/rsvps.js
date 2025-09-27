import { Router } from "express";

export default function rsvpRoutes(supabase) {
  const router = Router();

  // RSVP to an event
  router.post("/", async (req, res) => {
    const { user_id, event_id } = req.body;

    const { data, error } = await supabase
      .from("event_rsvps")
      .insert([{ user_id, event_id }]);

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  // Cancel RSVP
  router.delete("/", async (req, res) => {
    const { userId, eventId } = req.body;

    const { error } = await supabase
      .from("event_rsvps")
      .delete()
      .eq("user_id", userId)
      .eq("event_id", eventId);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  });

  // Get RSVPs for an event
  router.get("/:eventId", async (req, res) => {
    const { data, error } = await supabase
      .from("event_rsvps")
      .select("user_id, users(name, email, avatar_url)")
      .eq("event_id", req.params.eventId);

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  return router;
}