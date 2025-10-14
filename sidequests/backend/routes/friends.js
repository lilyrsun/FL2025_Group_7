import { Router } from "express";

export default function friendsRoutes(supabase) {
  const router = Router();

  // Send friend request
  router.post("/request", async (req, res) => {
    const { sender_id, receiver_email } = req.body;

    try {
      console.log("Looking for user with email:", receiver_email);
      console.log("Sender ID:", sender_id);
      
      // First, let's see all users in the database
      const { data: allUsers, error: allUsersError } = await supabase
        .from("users")
        .select("id, email, name");
      
      console.log("All users query result:", { allUsers, allUsersError });
      
      // Now find the specific user by email
      const { data: receiverData, error: receiverError } = await supabase
        .from("users")
        .select("id, email, name")
        .eq("email", receiver_email);

      console.log("User lookup result:", { receiverData, receiverError });
      
      const receiver = receiverData && receiverData.length > 0 ? receiverData[0] : null;

      if (receiverError || !receiver) {
        console.log("User not found error:", receiverError);
        return res.status(404).json({ error: "User not found" });
      }

      // Check if they're already friends
      const { data: existingFriendship, error: friendshipError } = await supabase
        .from("friendships")
        .select("*")
        .or(`and(user_id_1.eq.${sender_id},user_id_2.eq.${receiver.id}),and(user_id_1.eq.${receiver.id},user_id_2.eq.${sender_id})`)
        .eq("status", "accepted");

      if (friendshipError) {
        console.log("Friendship check error:", friendshipError);
        // If table doesn't exist, continue without checking existing friendships
        if (friendshipError.message.includes("does not exist")) {
          console.log("Friendships table doesn't exist yet, continuing...");
        } else {
          return res.status(500).json({ error: friendshipError.message });
        }
      }

      if (existingFriendship && existingFriendship.length > 0) {
        return res.status(400).json({ error: "Already friends with this user" });
      }

      // Check if there's already a pending request
      const { data: pendingRequest, error: pendingError } = await supabase
        .from("friendships")
        .select("*")
        .or(`and(user_id_1.eq.${sender_id},user_id_2.eq.${receiver.id}),and(user_id_1.eq.${receiver.id},user_id_2.eq.${sender_id})`)
        .eq("status", "pending");

      if (pendingError) {
        console.log("Pending request check error:", pendingError);
        // If table doesn't exist, continue without checking pending requests
        if (pendingError.message.includes("does not exist")) {
          console.log("Friendships table doesn't exist yet, continuing...");
        } else {
          return res.status(500).json({ error: pendingError.message });
        }
      }

      if (pendingRequest && pendingRequest.length > 0) {
        return res.status(400).json({ error: "Friend request already pending" });
      }

      // Create friend request
      const { data, error } = await supabase
        .from("friendships")
        .insert([{
          user_id_1: sender_id,
          user_id_2: receiver.id,
          status: "pending",
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.log("Insert friendship error:", error);
        if (error.message.includes("does not exist")) {
          return res.status(500).json({ 
            error: "Friendships table not found. Please run the database migration to create the friendships table." 
          });
        }
        return res.status(400).json({ error: error.message });
      }

      res.json({ 
        message: "Friend request sent",
        receiver: { id: receiver.id, name: receiver.name, email: receiver.email }
      });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get friend requests for a user
  router.get("/requests/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
      const { data, error } = await supabase
        .from("friendships")
        .select(`
          id,
          user_id_1,
          user_id_2,
          created_at,
          sender:users!friendships_user_id_1_fkey(id, name, email, profile_picture)
        `)
        .eq("user_id_2", userId)
        .eq("status", "pending");

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get sent friend requests for a user
  router.get("/sent/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
      const { data, error } = await supabase
        .from("friendships")
        .select(`
          id,
          user_id_1,
          user_id_2,
          created_at,
          receiver:users!friendships_user_id_2_fkey(id, name, email, profile_picture)
        `)
        .eq("user_id_1", userId)
        .eq("status", "pending");

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Accept friend request
  router.post("/accept", async (req, res) => {
    const { friendship_id, user_id } = req.body;

    try {
      const { data, error } = await supabase
        .from("friendships")
        .update({ 
          status: "accepted",
          updated_at: new Date().toISOString()
        })
        .eq("id", friendship_id)
        .eq("user_id_2", user_id)
        .eq("status", "pending");

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (data && data.length === 0) {
        return res.status(404).json({ error: "Friend request not found" });
      }

      res.json({ message: "Friend request accepted" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Reject friend request
  router.post("/reject", async (req, res) => {
    const { friendship_id, user_id } = req.body;

    try {
      const { data, error } = await supabase
        .from("friendships")
        .update({ 
          status: "rejected",
          updated_at: new Date().toISOString()
        })
        .eq("id", friendship_id)
        .eq("user_id_2", user_id)
        .eq("status", "pending");

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      if (data && data.length === 0) {
        return res.status(404).json({ error: "Friend request not found" });
      }

      res.json({ message: "Friend request rejected" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user's friends
  router.get("/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
      const { data, error } = await supabase
        .from("friendships")
        .select(`
          id,
          user_id_1,
          user_id_2,
          created_at,
          friend:users!friendships_user_id_1_fkey(id, name, email, profile_picture),
          friend2:users!friendships_user_id_2_fkey(id, name, email, profile_picture)
        `)
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
        .eq("status", "accepted");

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      // Transform the data to return the friend information
      const friends = data.map(friendship => {
        const friend = friendship.user_id_1 === userId ? friendship.friend2 : friendship.friend;
        return {
          id: friend.id,
          name: friend.name,
          email: friend.email,
          profile_picture: friend.profile_picture,
          friendship_id: friendship.id,
          friends_since: friendship.created_at
        };
      });

      res.json(friends);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Remove friend
  router.delete("/:friendshipId", async (req, res) => {
    const { friendshipId } = req.params;
    const { user_id } = req.body;

    try {
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId)
        .or(`user_id_1.eq.${user_id},user_id_2.eq.${user_id}`)
        .eq("status", "accepted");

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json({ message: "Friend removed" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
