import { useEffect } from "react";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export function useSupabaseAuth() {
  const { setUser } = useAuth();

  useEffect(() => {
    const handler = async ({ url }: { url: string }) => {
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(url);

        if (error) {
          console.error("Auth error:", error.message);
        } else {
          setUser(data.session?.user ?? null);
        }
      } catch (err) {
        console.error("Failed to exchange code for session:", err);
      }
    };

    const sub = Linking.addEventListener("url", handler);

    return () => sub.remove();
  }, []);
}