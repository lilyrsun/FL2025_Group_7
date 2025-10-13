import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { BACKEND_API_URL } from "@env";

type User = any;

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load session on mount
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    // Listen to auth changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const authedUser = session?.user ?? null;
      setUser(authedUser);

      if (authedUser) {
        ensureUserInDatabase(authedUser);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const ensureUserInDatabase = async (authedUser: User) => {
    try {
      const { name, email, avatar_url } = authedUser.user_metadata;
      const { id } = authedUser;

      // Check if BACKEND_API_URL is available
      if (!BACKEND_API_URL) {
        console.warn("BACKEND_API_URL not configured, skipping user database sync");
        return;
      }

      const res = await fetch(BACKEND_API_URL + "/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, email, profile_picture: avatar_url }),
      });
      
      const data = await res.json();

      if (res.ok) {
        console.log("Success, user added/updated to database");
      } else {
        console.log("Error", data.error || "Something went wrong");
      }
    } catch (err) {
      // More specific error handling
      if (err instanceof TypeError && err.message === "Network request failed") {
        console.warn("Backend server appears to be offline. User authentication will still work, but some features may be limited.");
      } else {
        console.error("Error ensuring user in DB:", err);
      }
    }
  };

  // Sign out function
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for consuming auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}