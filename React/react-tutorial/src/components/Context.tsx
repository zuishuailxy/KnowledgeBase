import React from "react";
import { useState, useContext } from "react";

const ThemeContext = React.createContext({} as IThemeContext);
interface IThemeContext {
  theme: string;
  setTheme: (theme: string) => void;
}

export default function Context() {
  const [theme, setTheme] = useState("light");
  return (
    <div>
      <ThemeContext value={{ theme, setTheme }}>
        Context Component
        <Parent />
      </ThemeContext>
    </div>
  );
}

const Parent = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const styles = {
    backgroundColor: theme === "light" ? "#fff" : "#333",
    color: theme === "light" ? "#000" : "#fff",
    padding: "10px",
    marginTop: "10px",
    border: "1px solid " + (theme === "light" ? "#000" : "#fff"),
  };
  return (
    <div style={styles}>
      Parent Component
      <Child />
    </div>
  );
};

const Child = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const styles = {
    backgroundColor: theme === "light" ? "#fff" : "#333",
    color: theme === "light" ? "#000" : "#fff",
    padding: "10px",
    marginTop: "10px",
    border: "1px solid " + (theme === "light" ? "#000" : "#fff"),
  };

  return (
    <div style={styles}>
      Child Component{" "}
      <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
        Toggle Theme
      </button>
    </div>
  );
};
