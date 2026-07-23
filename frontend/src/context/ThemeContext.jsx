import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(() => {
    return localStorage.getItem("tema") || "dark";
  });

  useEffect(() => {
    localStorage.setItem("tema", tema);
    document.documentElement.setAttribute("data-tema", tema);
  }, [tema]);

  const toggleTema = () => setTema((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ tema, toggleTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTema() {
  return useContext(ThemeContext);
}
