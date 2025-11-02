import { Router } from "express";

export default function diaryRoutes(supabase) {
  const router = Router();

  // Get user's past events (diary entries)
  router.get("/:userId", async (req, res) => {
    try {
      // Join event_rsvps with events, filter for past events only
      const { data, error } = await supabase
        .from("event_rsvps")
        .select(`
          event_id,
          events (
            id,
            title,
            date,
            type,
            latitude,
            longitude,
            created_at,
            user_id,
            users (id, name, email, profile_picture)
          )
        `)
        .eq("user_id", req.params.userId);

      if (error) return res.status(400).json({ error: error.message });

      // Filter for past events and get diary entries
      const now = Date.now();
      const pastEvents = (data || [])
        .map((row) => row.events)
        .filter(Boolean)
        .filter((evt) => {
          if (!evt.date) return false; // exclude spontaneous/no-date events
          const eventTime = new Date(evt.date).getTime();
          return eventTime < now;
        })
        .sort((a, b) => {
          const ta = a.date ? new Date(a.date).getTime() : 0;
          const tb = b.date ? new Date(b.date).getTime() : 0;
          return tb - ta; // newest first
        });

      // Get diary entries for these events
      const eventIds = pastEvents.map((e) => e.id);
      const { data: diaryData, error: diaryError } = await supabase
        .from("diary_entries")
        .select("*")
        .in("event_id", eventIds);

      if (diaryError) {
        console.error("Error loading diary entries:", diaryError);
      }

      // Merge diary entries with events
      const eventsWithDiary = pastEvents.map((event) => {
        const diaryEntry = diaryData?.find((d) => d.event_id === event.id);
        return {
          ...event,
          diary: diaryEntry || null,
        };
      });

      res.json(eventsWithDiary);
    } catch (e) {
      res.status(500).json({ error: "Failed to load diary" });
    }
  });

  // Get attendees for a past event
  router.get("/event/:eventId/attendees", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("user_id, users(name, email, profile_picture)")
        .eq("event_id", req.params.eventId);

      if (error) return res.status(400).json({ error: error.message });
      res.json(data || []);
    } catch (e) {
      res.status(500).json({ error: "Failed to load attendees" });
    }
  });

  // Create or update diary entry
  router.post("/", async (req, res) => {
    try {
      const { user_id, event_id, reflection, photo_urls } = req.body;

      if (!user_id || !event_id) {
        return res.status(400).json({ error: "Missing required fields: user_id, event_id" });
      }

      // Check if entry exists
      const { data: existing, error: checkError } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("user_id", user_id)
        .eq("event_id", event_id)
        .single();

      let result;
      if (existing && !checkError) {
        // Update existing entry
        const updates = {};
        if (reflection !== undefined) updates.reflection = reflection;
        if (photo_urls !== undefined) updates.photo_urls = photo_urls;

        const { data, error } = await supabase
          .from("diary_entries")
          .update(updates)
          .eq("id", existing.id)
          .select()
          .single();

        if (error) return res.status(400).json({ error: error.message });
        result = data;
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from("diary_entries")
          .insert([{ user_id, event_id, reflection, photo_urls: photo_urls || [] }])
          .select()
          .single();

        if (error) return res.status(400).json({ error: error.message });
        result = data;
      }

      res.json(result);
    } catch (e) {
      res.status(500).json({ error: "Failed to save diary entry" });
    }
  });

  // Upload photo for diary entry
  router.post("/upload-photo/:eventId", async (req, res) => {
    try {
      const { user_id, photo_url } = req.body;

      if (!user_id || !photo_url) {
        return res.status(400).json({ error: "Missing required fields: user_id, photo_url" });
      }

      // Get or create diary entry
      const { data: existing, error: checkError } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("user_id", user_id)
        .eq("event_id", req.params.eventId)
        .single();

      let photo_urls = [];
      if (existing && !checkError) {
        photo_urls = existing.photo_urls || [];
      }

      // Add new photo URL
      if (!photo_urls.includes(photo_url)) {
        photo_urls.push(photo_url);
      }

      // Update or create entry
      if (existing && !checkError) {
        const { data, error } = await supabase
          .from("diary_entries")
          .update({ photo_urls })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
      } else {
        const { data, error } = await supabase
          .from("diary_entries")
          .insert([{ user_id, event_id: req.params.eventId, photo_urls }])
          .select()
          .single();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
      }
    } catch (e) {
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });

  return router;
}

