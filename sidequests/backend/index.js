import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend is running!!!" });
});

// test API route
app.get("/hello", (req, res) => {
  res.json({ msg: "Hello from backend!" });
});

// routes
import userRoutes from "./routes/users.js";
import eventRoutes from "./routes/events.js";
import uploadRoutes from "./routes/upload.js";
import rsvpRoutes from "./routes/rsvps.js";

app.use("/users", userRoutes(supabase));
app.use("/events", eventRoutes(supabase));
app.use("/upload", uploadRoutes(supabase));
app.use("/rsvps", rsvpRoutes(supabase));


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});