import { createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingSignup, setPendingSignup] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user ?? null);
      setLoading(false);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

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

  return (
    <UserContext.Provider
      value={{
        user,
        register,
        login,
        logout,
        loading,
        pendingSignup,
        startSignup,
        clearPendingSignup,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
