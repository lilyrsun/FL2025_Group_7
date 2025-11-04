import { Router } from "express";

export default function spontaneousRoutes(supabase) {
  const router = Router();

  // Helper function to check if two users are friends
  const areFriends = async (user_id_1, user_id_2) => {
    const { data, error } = await supabase
      .from("friendships")
      .select("*")
      .or(`and(user_id_1.eq.${user_id_1},user_id_2.eq.${user_id_2}),and(user_id_1.eq.${user_id_2},user_id_2.eq.${user_id_1})`)
      .eq("status", "accepted");

    if (error) {
      console.error("Error checking friendship:", error);
      return false;
    }

    return data && data.length > 0;
  };

  // Start or update a spontaneous presence
  router.post("/start", async (req, res) => {
    const { user_id, status_text, latitude, longitude, accuracy, visibility = "friends" } = req.body;

    if (!user_id || !latitude || !longitude) {
      return res.status(400).json({ error: "user_id, latitude, and longitude are required" });
    }

    // Validate visibility value
    if (visibility !== "friends" && visibility !== "public") {
      return res.status(400).json({ error: "visibility must be either 'friends' or 'public'" });
    }

    try {
      // Expires in 10 minutes
      const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Check if user already has an active presence
      const { data: existing } = await supabase
        .from("spontaneous_presences")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_active", true)
        .single();

      let result;
      if (existing) {
        // Update existing presence
        const { data, error } = await supabase
          .from("spontaneous_presences")
          .update({
            status_text: status_text || existing.status_text,
            latitude,
            longitude,
            accuracy: accuracy || null,
            last_seen: new Date().toISOString(),
            expires_at,
            visibility: visibility || existing.visibility,
          })
          .eq("user_id", user_id)
          .eq("is_active", true)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new presence
        const { data, error } = await supabase
          .from("spontaneous_presences")
          .insert([{
            user_id,
            status_text: status_text || "Available for a spontaneous hangout!",
            latitude,
            longitude,
            accuracy: accuracy || null,
            is_active: true,
            last_seen: new Date().toISOString(),
            expires_at,
            visibility: visibility || "friends",
          }])
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      res.json(result);
    } catch (error) {
      console.error("Error starting spontaneous presence:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Update location
  router.post("/update-location", async (req, res) => {
    const { user_id, latitude, longitude, accuracy } = req.body;

    if (!user_id || !latitude || !longitude) {
      return res.status(400).json({ error: "user_id, latitude, and longitude are required" });
    }

    try {
      const { data, error } = await supabase
        .from("spontaneous_presences")
        .update({
          latitude,
          longitude,
          accuracy: accuracy || null,
          last_seen: new Date().toISOString(),
        })
        .eq("user_id", user_id)
        .eq("is_active", true)
        .select(); // allow multiple rows; client treats success if any updated

      if (error) throw error;

      if (!data || data.length === 0) {
        return res.status(404).json({ error: "No active spontaneous presence found" });
      }

      // Return the most recently seen row
      const sorted = [...data].sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen));
      res.json(sorted[0]);
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Stop sharing spontaneous presence
  router.post("/stop", async (req, res) => {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    try {
      // Find latest active presence for this user
      const { data: rows, error: findErr } = await supabase
        .from("spontaneous_presences")
        .select("id, last_seen")
        .eq("user_id", user_id)
        .eq("is_active", true);

      if (findErr) throw findErr;
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: "No active spontaneous presence found" });
      }

      const latest = rows.sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen))[0];

      const { data, error } = await supabase
        .from("spontaneous_presences")
        .update({ is_active: false })
        .eq("id", latest.id)
        .select()
        .single();

      if (error) throw error;

      res.json({ message: "Spontaneous presence stopped", data });
    } catch (error) {
      console.error("Error stopping spontaneous presence:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Get nearby spontaneous presences (friends with visibility='friends' + all with visibility='public')
  router.get("/nearby", async (req, res) => {
    const { user_id, latitude, longitude, radius_miles = 5 } = req.query;

    if (!user_id || !latitude || !longitude) {
      return res.status(400).json({ error: "user_id, latitude, and longitude are required" });
    }

    try {
      // First, get all friends of the requesting user
      const { data: friendships, error: friendsError } = await supabase
        .from("friendships")
        .select("*")
        .or(`user_id_1.eq.${user_id},user_id_2.eq.${user_id}`)
        .eq("status", "accepted");

      if (friendsError) {
        console.error("Error fetching friends:", friendsError);
        return res.status(500).json({ error: "Failed to fetch friends" });
      }

      // Extract friend IDs
      const friendIds = friendships
        ?.map(f => f.user_id_1 === user_id ? f.user_id_2 : f.user_id_1) || [];

      // Get presences from two sources:
      // 1. Friends with visibility='friends'
      // 2. Anyone with visibility='public'
      let friendPresences = [];
      if (friendIds.length > 0) {
        const { data: friendPresencesData, error: friendPresenceError } = await supabase
          .from("spontaneous_presences")
          .select(`
            *,
            users!spontaneous_presences_user_id_fkey(id, name, email, profile_picture)
          `)
          .in("user_id", friendIds)
          .eq("is_active", true)
          .eq("visibility", "friends");

        if (friendPresenceError) {
          console.error("Error fetching friend presences:", friendPresenceError);
        } else {
          friendPresences = friendPresencesData || [];
        }
      }

      // Get public presences (from anyone, not just friends, but exclude the requesting user's own presence)
      const { data: publicPresences, error: publicPresenceError } = await supabase
        .from("spontaneous_presences")
        .select(`
          *,
          users!spontaneous_presences_user_id_fkey(id, name, email, profile_picture)
        `)
        .eq("is_active", true)
        .eq("visibility", "public")
        .neq("user_id", user_id); // Exclude the requesting user's own presence

      if (publicPresenceError) {
        console.error("Error fetching public presences:", publicPresenceError);
      }

      // Combine both lists, avoiding duplicates
      const allPresences = [...friendPresences];
      const publicPresencesList = publicPresences || [];
      publicPresencesList.forEach(p => {
        if (!allPresences.find(fp => fp.id === p.id)) {
          allPresences.push(p);
        }
      });

      // Filter by geographic distance
      const R = 3958.8; // Earth radius in miles
      const toRad = (d) => (d * Math.PI) / 180;

      const requestLat = parseFloat(latitude);
      const requestLon = parseFloat(longitude);
      const requestRadius = parseFloat(radius_miles);

      console.log('Debug - allPresences:', allPresences);
      console.log('Debug - friendIds:', friendIds);
      console.log('Debug - requesting user_id:', user_id);
      console.log('Debug - request location:', { latitude: requestLat, longitude: requestLon, radius_miles: requestRadius });

      const nearbyPresences = allPresences?.filter((p) => {
        const dLat = toRad(p.latitude - requestLat);
        const dLon = toRad(p.longitude - requestLon);
        const lat1 = toRad(requestLat);
        const lat2 = toRad(p.latitude);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        
        console.log(`Debug - presence ${p.user_id} distance: ${d.toFixed(2)} miles (within ${requestRadius}? ${d <= requestRadius})`);
        
        return d <= requestRadius;
      });

      console.log('Debug - nearbyPresences:', nearbyPresences);
      res.json(nearbyPresences || []);
    } catch (error) {
      console.error("Error fetching nearby presences:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user's own active presence
  router.get("/me/:user_id", async (req, res) => {
    const { user_id } = req.params;

    try {
      const { data, error } = await supabase
        .from("spontaneous_presences")
        .select(`
          *,
          users!spontaneous_presences_user_id_fkey(id, name, email, profile_picture)
        `)
        .eq("user_id", user_id)
        .eq("is_active", true)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows found
          return res.status(404).json({ error: "No active spontaneous presence" });
        }
        throw error;
      }

      res.json(data);
    } catch (error) {
      console.error("Error fetching user's presence:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Join/update participation in a spontaneous presence (MUST come before /:presence_id route)
  router.post("/participate", async (req, res) => {
    const { user_id, presence_id, status } = req.body; // status: "coming" | "there" | null

    if (!user_id || !presence_id) {
      return res.status(400).json({ error: "user_id and presence_id are required" });
    }

    if (status && !["coming", "there"].includes(status)) {
      return res.status(400).json({ error: "status must be 'coming' or 'there'" });
    }

    try {
      // Check if participant already exists
      const { data: existing, error: checkError } = await supabase
        .from("spontaneous_presence_participants")
        .select("*")
        .eq("user_id", user_id)
        .eq("presence_id", presence_id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (status === null || status === undefined) {
        // Remove participation
        if (existing) {
          const { error: deleteError } = await supabase
            .from("spontaneous_presence_participants")
            .delete()
            .eq("user_id", user_id)
            .eq("presence_id", presence_id);

          if (deleteError) throw deleteError;
          return res.json({ message: "Participation removed" });
        }
        return res.json({ message: "No participation to remove" });
      }

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("spontaneous_presence_participants")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("user_id", user_id)
          .eq("presence_id", presence_id)
          .select()
          .single();

        if (error) throw error;
        return res.json(data);
      } else {
        // Create new
        const { data, error } = await supabase
          .from("spontaneous_presence_participants")
          .insert([{
            user_id,
            presence_id,
            status,
          }])
          .select()
          .single();

        if (error) throw error;
        return res.json(data);
      }
    } catch (error) {
      console.error("Error updating participation:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Get a specific spontaneous presence by ID
  router.get("/:presence_id", async (req, res) => {
    const { presence_id } = req.params;

    try {
      const { data, error } = await supabase
        .from("spontaneous_presences")
        .select(`
          *,
          users!spontaneous_presences_user_id_fkey(id, name, email, profile_picture)
        `)
        .eq("id", presence_id)
        .eq("is_active", true)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return res.status(404).json({ error: "Spontaneous presence not found" });
        }
        throw error;
      }

      res.json(data);
    } catch (error) {
      console.error("Error fetching presence:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Get participants for a spontaneous presence
  router.get("/:presence_id/participants", async (req, res) => {
    const { presence_id } = req.params;

    try {
      const { data, error } = await supabase
        .from("spontaneous_presence_participants")
        .select(`
          user_id,
          status,
          created_at,
          updated_at,
          users!spontaneous_presence_participants_user_id_fkey(id, name, email, profile_picture)
        `)
        .eq("presence_id", presence_id);

      if (error) throw error;

      res.json(data || []);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

