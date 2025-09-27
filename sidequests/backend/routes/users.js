import { Router } from "express";

export default function userRoutes(supabase) {
  const router = Router();

  // Create user
  router.post("/", async (req, res) => {
    const { name, email, id } = req.body;

    const { data, error } = await supabase
      .from("users")
      .insert([{ name, email, id }]);

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