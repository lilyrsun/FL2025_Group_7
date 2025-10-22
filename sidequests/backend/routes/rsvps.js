import { Router } from "express";

export default function rsvpRoutes(supabase) {
  const router = Router();

  // Set RSVP status: "yes" or "no"
  router.post("/", async (req, res) => {
    const { user_id, event_id, status } = req.body; // "yes" or "no"

    if (!user_id || !event_id)
      return res.status(400).json({ error: "Missing parameters" });

    if (status === "yes" || status === "no") {
      const { data, error } = await supabase
        .from("event_rsvps")
        .upsert([{ user_id, event_id, status }], { onConflict: "user_id,event_id" });

      if (error) return res.status(400).json({ error: error.message });
      return res.json(data);
    }

    // If neither yes nor no, remove RSVP
    if (!status) {
      const { error } = await supabase
        .from("event_rsvps")
        .delete()
        .eq("user_id", user_id)
        .eq("event_id", event_id);
        
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    }

  });

  // Get RSVPs for an event
  router.get("/:eventId", async (req, res) => {
    const { data, error } = await supabase
      .from("event_rsvps")
      .select("user_id, status, users(name, email, profile_picture)")
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