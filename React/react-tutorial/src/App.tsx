import { useState } from "react";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const obj = { name: 1 };
  const handleClick = <T,>(value: T) => {
    return setCount(c => c + 1)
  };
  const cls = "test"
  const style = {
    color: "red"
  }

  const html = `<h1>hello</h1>`
  // 生成个mock数组
  const mockArray = Array.from({ length: 10 }, (_, i) => i + 1);
  return (
    <>
      <div>
        <div dangerouslySetInnerHTML={{ __html: html }}></div>
        <p id={String(123)} className={`${cls} aa`} style={style}>test</p>
        <p>{count}</p>
        <button onClick={handleClick}>click</button>
        <ul>{mockArray.map(item => <li key={item}>{item}</li>)}</ul>
      </div>
    </>
  );
}

export default App;
