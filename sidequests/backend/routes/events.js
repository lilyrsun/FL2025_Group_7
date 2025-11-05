import { Router } from "express";

export default function eventRoutes(supabase) {
  const router = Router();
  
  // Create event
  router.post("/", async (req, res) => {
    const { title, date, type, user_id, latitude, longitude, invitee_ids } = req.body;

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

    // 3️⃣ Add invitees if provided (restrict event to specific friends)
    if (invitee_ids && Array.isArray(invitee_ids) && invitee_ids.length > 0) {
      const invitees = invitee_ids.map(invitee_id => ({
        event_id: eventData.id,
        user_id: invitee_id,
      }));

      const { error: inviteeError } = await supabase
        .from("event_rsvp_invitees")
        .insert(invitees);

      if (inviteeError) {
        console.error("Invitee error:", inviteeError);
        // Not fatal, but log it
      } else {
        console.log("✅ Invitees added:", invitee_ids.length);
      }
    }

    // 4️⃣ Respond with event + RSVP info
    res.json({
      event: eventData,
      rsvp: rsvpData,
    });
  });

  // Get events (only future ones, include host user)
  // Query param: user_id - to filter events based on invitee restrictions
  router.get("/", async (req, res) => {
    const { user_id } = req.query;
    const now = new Date().toISOString(); // current UTC timestamp

    // Get all future events
    const { data: allEvents, error } = await supabase
      .from("events")
      .select("*, users(id, name, email, profile_picture)")
      .gt("date", now) // only dates after current time
      .order("date", { ascending: true }); // optional: sort by soonest first

    if (error) {
      console.error("Error fetching events:", error);
      return res.status(400).json({ error: error.message });
    }

    // If user_id is provided, filter events based on invitee restrictions and friendship
    if (user_id && allEvents) {
      // Get all events with invitee restrictions
      const { data: inviteeData } = await supabase
        .from("event_rsvp_invitees")
        .select("event_id, user_id");

      // Build a map of event_id -> array of user_ids who can see it
      const inviteeMap = {};
      if (inviteeData) {
        inviteeData.forEach(inv => {
          if (!inviteeMap[inv.event_id]) {
            inviteeMap[inv.event_id] = [];
          }
          inviteeMap[inv.event_id].push(inv.user_id);
        });
      }

      // Get user's friends for friendship check
      const { data: friendships } = await supabase
        .from("friendships")
        .select("user_id_1, user_id_2")
        .or(`user_id_1.eq.${user_id},user_id_2.eq.${user_id}`)
        .eq("status", "accepted");

      const friendIds = new Set();
      if (friendships) {
        friendships.forEach(f => {
          if (f.user_id_1 === user_id) {
            friendIds.add(f.user_id_2);
          } else {
            friendIds.add(f.user_id_1);
          }
        });
      }

      // Filter events:
      // - Events created by the user (always visible)
      // - Events with no invitee restrictions: visible if user is friends with creator
      // - Events with invitee restrictions: visible if user is in the invitee list
      const filteredEvents = allEvents.filter(event => {
        // Event creator can always see their own events
        if (event.user_id === user_id) {
          return true;
        }

        // Check if user is friends with event creator
        const isFriend = friendIds.has(event.user_id);

        // If event has no invitee restrictions, it's visible to all friends of creator
        if (!inviteeMap[event.id] || inviteeMap[event.id].length === 0) {
          return isFriend;
        }

        // If event has invitee restrictions, check if user is in the list
        return inviteeMap[event.id].includes(user_id);
      });

      res.json(filteredEvents);
    } else {
      // No user_id provided, return all events (for backward compatibility)
      res.json(allEvents);
    }
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

  // Get invitees for an event (with user details)
  router.get("/:id/invitees", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("event_rsvp_invitees")
        .select("user_id, users(id, name, email, profile_picture)")
        .eq("event_id", req.params.id);

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ invitees: data || [], count: data?.length || 0 });
    } catch (error) {
      console.error("Error fetching invitees:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}