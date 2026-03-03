import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export const UserContext = createContext();
const DEFAULT_ROLE = "client";

const normalizeRole = (value) => {
  const role = String(value || "").toLowerCase();
  if (role === "trainer" || role === "admin") return role;
  return DEFAULT_ROLE;
};

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingSignup, setPendingSignup] = useState(null);

  const hydrateUserProfile = useCallback(async (nextUser) => {
    setUser(nextUser || null);
    if (!nextUser?.id) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", nextUser.id)
      .maybeSingle();

    if (error) {
      setProfile(null);
      return null;
    }

    setProfile(data || null);
    return data || null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (error) return null;
    setProfile(data || null);
    return data || null;
  }, [user?.id]);

  useEffect(() => {
    let active = true;

    const init = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      await hydrateUserProfile(data?.user ?? null);
      if (active) setLoading(false);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      setLoading(true);
      await hydrateUserProfile(session?.user ?? null);
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [hydrateUserProfile]);

  const startSignup = (payload) => setPendingSignup(payload);
  const clearPendingSignup = () => setPendingSignup(null);

  async function register({
    email,
    password,
    firstName,
    lastName,
    age,
    weight,
    weightUnit,
    goal,
  }) {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          first_name: firstName?.trim(),
          last_name: lastName?.trim(),
          age: age ? String(age) : "",
          weight: weight ? String(weight) : "",
          weight_unit: weightUnit || "",
          goal: goal?.trim(),
        },
      },
    });
    if (error) throw error;
    return data.user;
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  const role = useMemo(() => normalizeRole(profile?.role), [profile?.role]);
  const isAdmin = role === "trainer" || role === "admin";

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        register,
        login,
        logout,
        loading,
        refreshProfile,
        pendingSignup,
        startSignup,
        clearPendingSignup,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
