import { Router } from "express";

export default function rsvpRoutes(supabase) {
  const router = Router();

  // RSVP to an event (create or update)
  router.post("/", async (req, res) => {
    const { user_id, event_id, status } = req.body;

    if (!user_id || !event_id) {
      return res.status(400).json({ error: "user_id and event_id are required" });
    }

    try {
      // Check if RSVP already exists (handle multiple rows if they exist)
      const { data: existingRows, error: checkError } = await supabase
        .from("event_rsvps")
        .select("*")
        .eq("user_id", user_id)
        .eq("event_id", event_id);

      if (checkError) {
        console.error("Error checking existing RSVP:", checkError);
        return res.status(400).json({ error: checkError.message });
      }

      // If multiple RSVPs exist, clean them up and treat as new
      const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;
      
      if (existingRows && existingRows.length > 1) {
        console.log(`Found ${existingRows.length} duplicate RSVPs, will clean up`);
        // Delete all but keep the first one to update
        const idsToDelete = existingRows.slice(1).map(r => r.id);
        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from("event_rsvps")
            .delete()
            .in("id", idsToDelete);
          
          if (deleteError) {
            console.error("Error deleting duplicate RSVPs:", deleteError);
          }
        }
      }

      // If status is null or "none", delete the RSVP
      if (!status || status === "none") {
        if (existing) {
          const { error: deleteError } = await supabase
            .from("event_rsvps")
            .delete()
            .eq("user_id", user_id)
            .eq("event_id", event_id);

          if (deleteError) return res.status(400).json({ error: deleteError.message });
          return res.json({ user_id, event_id, status: null });
        }
        return res.json({ user_id, event_id, status: null });
      }

      // Validate status
      if (status !== "yes" && status !== "no") {
        return res.status(400).json({ error: "status must be 'yes' or 'no'" });
      }

      let result;
      if (existing) {
        // Update existing RSVP
        console.log(`Updating RSVP for user ${user_id}, event ${event_id} with status: ${status}`);
        const { data, error } = await supabase
          .from("event_rsvps")
          .update({ status })
          .eq("user_id", user_id)
          .eq("event_id", event_id)
          .select("user_id, status, users(name, email, profile_picture)")
          .single();

        if (error) {
          console.error("Error updating RSVP:", error);
          return res.status(400).json({ error: error.message });
        }
        result = data;
        console.log("Updated RSVP result:", result);
      } else {
        // Create new RSVP - first check if any duplicates exist and clean them up
        console.log(`Creating new RSVP for user ${user_id}, event ${event_id} with status: ${status}`);
        
        // Check for any existing RSVPs (in case of duplicates)
        const { data: duplicates, error: dupError } = await supabase
          .from("event_rsvps")
          .select("id")
          .eq("user_id", user_id)
          .eq("event_id", event_id);

        if (dupError) {
          console.error("Error checking for duplicates:", dupError);
        }

        // If duplicates exist, delete them first
        if (duplicates && duplicates.length > 0) {
          console.log(`Found ${duplicates.length} existing RSVP(s), cleaning up...`);
          const { error: deleteError } = await supabase
            .from("event_rsvps")
            .delete()
            .eq("user_id", user_id)
            .eq("event_id", event_id);

          if (deleteError) {
            console.error("Error deleting duplicates:", deleteError);
            return res.status(400).json({ error: deleteError.message });
          }
        }

        // Now insert the new RSVP
        const { data, error } = await supabase
          .from("event_rsvps")
          .insert([{ user_id, event_id, status }])
          .select("user_id, status, users(name, email, profile_picture)")
          .single();

        if (error) {
          console.error("Error creating RSVP:", error);
          return res.status(400).json({ error: error.message });
        }
        result = data;
        console.log("Created RSVP result:", result);
      }

      res.json(result);
    } catch (error) {
      console.error("Error updating RSVP:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Cancel RSVP (accept both userId/eventId and user_id/event_id for compatibility)
  router.delete("/", async (req, res) => {
    const { userId, eventId, user_id, event_id } = req.body;

    const uid = userId || user_id;
    const eid = eventId || event_id;

    if (!uid || !eid) {
      return res.status(400).json({ error: "user_id and event_id are required" });
    }

    const { error } = await supabase
      .from("event_rsvps")
      .delete()
      .eq("user_id", uid)
      .eq("event_id", eid);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
  });

  // Get RSVPs for an event (include status field)
  router.get("/:eventId", async (req, res) => {
    const { data, error } = await supabase
      .from("event_rsvps")
      .select("user_id, status, users(name, email, profile_picture)")
      .eq("event_id", req.params.eventId)
      .in("status", ["yes", "no"]); // Only return RSVPs with "yes" or "no" status

    if (error) {
      console.error("Error fetching RSVPs:", error);
      return res.status(400).json({ error: error.message });
    }
    
    console.log(`Fetched ${data?.length || 0} RSVPs for event ${req.params.eventId}:`, data);
    res.json(data || []);
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