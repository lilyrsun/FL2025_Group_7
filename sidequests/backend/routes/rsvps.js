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
      .select("user_id, users(name, email, profile_picture)")
      .eq("event_id", req.params.eventId);

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  // Get upcoming RSVPs for a user (joined with events)
  router.get("/user/:userId", async (req, res) => {
    try {
      // Join rsvps with events and only return future events if date is set
      const { data, error } = await supabase
        .from("event_rsvps")
        .select(`event_id, events ( id, title, date, type, latitude, longitude, created_at, user_id )`)
        .eq("user_id", req.params.userId);

      if (error) return res.status(400).json({ error: error.message });

      // Flatten out the joined structure and filter upcoming by date when available
      const events = (data || [])
        .map((row) => row.events)
        .filter(Boolean)
        .filter((evt) => {
          if (!evt.date) return true; // include spontaneous/no-date events
          const eventTime = new Date(evt.date).getTime();
          const now = Date.now();
          return eventTime >= now;
        })
        .sort((a, b) => {
          const ta = a.date ? new Date(a.date).getTime() : 0;
          const tb = b.date ? new Date(b.date).getTime() : 0;
          return ta - tb;
        });

      res.json(events);
    } catch (e) {
      res.status(500).json({ error: "Failed to load user RSVPs" });
    }
  });

  return router;
}