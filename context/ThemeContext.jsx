import { createContext, useContext, useState } from "react";
import { Colors } from "../contants/Colors";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Dark mode par default
  const [mode, setMode] = useState("dark");

  // deriver les colors de mode
  const theme = Colors[mode];

  const toggleTheme = () => {
    setMode(prev => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
