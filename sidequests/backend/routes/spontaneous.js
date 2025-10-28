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
    const { user_id, status_text, latitude, longitude, accuracy } = req.body;

    if (!user_id || !latitude || !longitude) {
      return res.status(400).json({ error: "user_id, latitude, and longitude are required" });
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
            visibility: "friends", // Only friends can see
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

  // Get nearby spontaneous presences (only friends)
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

      if (friendIds.length === 0) {
        return res.json([]);
      }

      // Get all active presences from friends
      const { data: allPresences, error: presenceError } = await supabase
        .from("spontaneous_presences")
        .select(`
          *,
          users!spontaneous_presences_user_id_fkey(id, name, email, profile_picture)
        `)
        .in("user_id", friendIds)
        .eq("is_active", true);

      if (presenceError) {
        console.error("Error fetching presences:", presenceError);
        return res.status(500).json({ error: "Failed to fetch presences" });
      }

      // Filter by geographic distance
      const R = 3958.8; // Earth radius in miles
      const toRad = (d) => (d * Math.PI) / 180;

      console.log('Debug - allPresences:', allPresences);
      console.log('Debug - friendIds:', friendIds);
      console.log('Debug - requesting user_id:', user_id);

      const nearbyPresences = allPresences?.filter((p) => {
        const dLat = toRad(p.latitude - parseFloat(latitude));
        const dLon = toRad(p.longitude - parseFloat(longitude));
        const lat1 = toRad(parseFloat(latitude));
        const lat2 = toRad(p.latitude);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d <= parseFloat(radius_miles);
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

  return router;
}

