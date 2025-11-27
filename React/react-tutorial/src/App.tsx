import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const obj = { name: 1 };
  const handleClick = <T,>(value: T) => {
    console.log(value);
  };
  const cls = "test"
  const style = {
    color: "red"
  }

  const html = `<h1>`
  return (
    <>
      <div>
        <p></p>
        <p id={String(123)} className={`${cls} aa`} style={style}>test</p>
        <button onClick={() => handleClick(123)}>click</button>
      </div>
    </>
  );
}

export default App;
