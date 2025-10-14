export type Event = {
  id: string;
  title: string;
  date: string;
  type: "Spontaneous" | "RSVP";
  latitude: number;
  longitude: number;
  created_at: string;
  user_id: string;
  users?: { id: string; name: string; email: string; profile_picture?: string };
};