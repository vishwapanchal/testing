import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type StaffRole = "admin" | "attending" | "nurse";

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  role: StaffRole;
  department: string | null;
  employee_id: string | null;
  hospital_id: string | null;
  avatar_url: string | null;
  hospital_name: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signInAsDemo: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  signInAsDemo: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async (userId: string) => {
    // Mocked out
  };

  const refreshProfile = async () => {
    // Mocked out
  };

  const signInAsDemo = () => {
    setUser({
      id: "mock-user-123",
      email: "demo@quantumhealth.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString()
    } as User);
    
    setSession({
      access_token: "mock-token",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: 10000000000,
      refresh_token: "mock-refresh",
      user: { id: "mock-user-123" } as User
    });
    
    setProfile({
      id: "mock-profile-123",
      user_id: "mock-user-123",
      full_name: "Dr. Alex Demo",
      role: "attending",
      department: "Intensive Care Unit",
      employee_id: "QH-1001",
      hospital_id: "hosp-demo",
      avatar_url: null,
      hospital_name: "Quantum Health Medical Center",
    });
  };

  useEffect(() => {
    // Auto-login disabled so user can see auth pages
  }, []);

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile, signInAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
}
