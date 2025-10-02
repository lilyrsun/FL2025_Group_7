import { Router } from "express";

export default function userRoutes(supabase) {
  const router = Router();

  // Create user
  router.post("/", async (req, res) => {
    const { name, email, id, profile_picture } = req.body;

    console.log(req.body);

    const { data, error } = await supabase
      .from("users")
      .upsert( // update or insert
        [{ id, name, email, profile_picture }],
        // .insert([{ name, email, id }]);
        { onConflict: "id" }
      );

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  // Get all users
  router.get("/", async (req, res) => {
    const { data, error } = await supabase.from("users").select("*");
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  });

  return router;
}