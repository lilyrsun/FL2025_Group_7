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
import friendsRoutes from "./routes/friends.js";
import spontaneousRoutes from "./routes/spontaneous.js";

app.use("/users", userRoutes(supabase));
app.use("/events", eventRoutes(supabase));
app.use("/friends", friendsRoutes(supabase));
app.use("/upload", uploadRoutes(supabase));
app.use("/rsvps", rsvpRoutes(supabase));
app.use("/spontaneous", spontaneousRoutes(supabase));


const PORT = process.env.PORT || 4000;
// Periodic task to expire spontaneous presences (runs every 5 minutes)
const expireSpontaneousPresences = async () => {
  try {
    const { data, error } = await supabase.rpc('expire_spontaneous_presences');
    if (error) {
      console.error('Error expiring spontaneous presences:', error);
    } else {
      console.log('Expired spontaneous presences check completed');
    }
  } catch (err) {
    console.error('Error in expire spontaneous presences task:', err);
  }
};

// Run expiry check every 5 minutes
setInterval(expireSpontaneousPresences, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log('Spontaneous presence expiry task started (runs every 5 minutes)');
});