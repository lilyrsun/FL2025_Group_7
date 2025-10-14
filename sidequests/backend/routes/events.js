import { Router } from "express";

export default function eventRoutes(supabase) {
  const router = Router();
  
  // Create event
  router.post("/", async (req, res) => {
    const { title, date, type, user_id, latitude, longitude } = req.body;

    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .insert([{ title, date, type, user_id, latitude, longitude }])
      .select()
      .single(); // Get the single inserted event back

    if (eventError) {
      console.error("Event creation error:", eventError);
      return res.status(400).json({ error: eventError.message });
    }

    console.log("✅ Event created:", eventData);

    // 2️⃣ RSVP the creator to their own event
    const { data: rsvpData, error: rsvpError } = await supabase
      .from("event_rsvps")
      .insert([{ user_id, event_id: eventData.id }])
      .select()
      .single();

    if (rsvpError) {
      console.error("RSVP error:", rsvpError);
      // not fatal, but you can choose to return an error if this must succeed
      return res.status(400).json({
        error: "Event created, but failed to RSVP creator",
        details: rsvpError.message,
      });
    }

    console.log("🙋 RSVP added for creator:", rsvpData);

    // 3️⃣ Respond with event + RSVP info
    res.json({
      event: eventData,
      rsvp: rsvpData,
    });
  });

  // Get events (only future ones, include host user)
  router.get("/", async (req, res) => {
    const now = new Date().toISOString(); // current UTC timestamp

    const { data, error } = await supabase
      .from("events")
      .select("*, users(id, name, email, profile_picture)")
      .gt("date", now) // only dates after current time
      .order("date", { ascending: true }); // optional: sort by soonest first

    if (error) {
      console.error("Error fetching events:", error);
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  });

  // Get a single event by id (include host user)
  router.get("/:id", async (req, res) => {
    const { data, error } = await supabase
      .from("events")
      .select("*, users(id, name, email, profile_picture)")
      .eq("id", req.params.id)
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  return router;
}