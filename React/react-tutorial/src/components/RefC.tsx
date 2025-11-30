import { useState, useRef } from "react";

export default function RefC() {
  // useref 做数据存储
  const timer = useRef<null | number>(null);
  const [count, setCount] = useState(0);
  const start = () => {
    if (timer.current) return;
    timer.current = setInterval(() => {
      setCount((prev) => prev + 1);
    }, 100);
  };

  const stop = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  return (
    <div>
      <h2>RefC Component</h2>
      <p>Count: {count}</p>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  );
}
