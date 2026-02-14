import { createContext, useState, useEffect } from 'react';
import { account, ID } from '../storage/data';

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const current = await account.get();
      if (current) setUser(current);
    };
    loadUser();
  }, []);

  async function register(email, password, firstName, lastName) {
    try {
      const newUser = await account.create(ID.unique(), email, password, firstName, lastName);
      setUser(newUser);
    } catch (error) {
      console.error("Registration error:", error.message);
      throw error;
    }
  }

  async function login(email, password) {
    try {
      const loggedUser = await account.createEmailPasswordSession(email, password);
      setUser(loggedUser);
    } catch (error) {
      console.error("Login error:", error.message);
      throw error;
    }
  }

  async function logout() {
    await account.deleteSession();
    setUser(null);
  }

  return (
    <UserContext.Provider value={{ user, register, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}
