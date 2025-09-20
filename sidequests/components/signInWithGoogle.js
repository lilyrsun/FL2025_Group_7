import * as AuthSession from "expo-auth-session";
import { supabase } from "../lib/supabase";

const redirectUri = AuthSession.makeRedirectUri({
  scheme: "myapp",
  path: "auth/callback",
  useProxy: false,
});

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUri,
    },
  });

  if (error) {
    console.error("Error:", error.message);
    return null;
  }

  return data;
}
