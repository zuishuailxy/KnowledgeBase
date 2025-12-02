import React, { useCallback, useState, useId } from "react";

const map = new WeakMap();
let count = 1;

interface ChildProps {
  user: {
    name: string;
    age: number;
  },
  callback: () => void;
}

const Child = React.memo((props: ChildProps) => {
  const id = useId();
  console.log("child render");
  return <div>
    {props.user.name} - {props.user.age}
    <button onClick={props.callback}>Click me</button>
  </div>;
})

const Callback = () => {
  const id = useId();
  console.log("render");
  const [inputValue, setInputValue] = useState("");
  // 使用 useCallback 来缓存函数引用
  const changeValue = useCallback((e:React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, [])

  if (!map.has(changeValue)) {
    map.set(changeValue, count++);
  }

  console.log(map.get(changeValue));

  const [user, setUser] = useState({
    name: "Bob",
    age: 30,
  });

  // 不用的话 因为内存地址不一样，会导致子组件每次都被重新渲染
  const cb = useCallback(() => {
    console.log("use cb");
  }, []);
  return (
    <>
      <label htmlFor={id}>Input:</label>
      <input id={id} value={inputValue} onChange={changeValue}></input>
      <Child callback={cb} user={user} />
    </>
  );
};

export default Callback;
