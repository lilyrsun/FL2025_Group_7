export type Event = {
  id: string;
  title: string;
  date: string;
  type: "Spontaneous" | "RSVP";
  description?: string;
  location?: string;
};