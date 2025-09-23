import * as AuthSession from "expo-auth-session";
import * as WebBrowser from 'expo-web-browser'
import { supabase } from "../lib/supabase";

const redirectUri = AuthSession.makeRedirectUri({
  scheme: "sidequests",
  path: "auth/callback",
});

export async function signInWithGoogle() {
  console.log('Redirect URI:', redirectUri);
  console.log("Starting Google sign-in...")
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
  options: {
    redirectTo: 'https://auth.expo.io/@emilyhuang/sidequests',
  },
    });
    if (error) throw error;
    console.log("OAuth URL:", data.url);

    const res = await WebBrowser.openAuthSessionAsync(data?.url ?? '', 'https://auth.expo.io/@emilyhuang/sidequests')

    console.log(res)

    // return result;
  } catch (err: any) {
    console.log(err.message, "Failed to log in with Google");
  }
}
