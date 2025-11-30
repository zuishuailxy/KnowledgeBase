import { useState, useImperativeHandle, useRef } from "react";

interface ChildHandle {
  name: string;
  validate: () => boolean;
  reset: () => void;
}

const Child = ({ ref }: { ref: React.Ref<ChildHandle> }) => {
  const [data, setData] = useState({ name: "", password: "", email: "" });
  const validate = () => {
    if (data.name === "") {
      alert("name不能为空");
      return false;
    }
    if (data.password.length < 6) {
      alert("密码长度不能小于6位");
      return false;
    }

    return true;
  };

  const reset = () => {
    setData({ name: "", password: "", email: "" });
  };

  useImperativeHandle(ref, () => ({
    name: "子组件",
    validate,
    reset,
  }));

  return (
    <div>
      <h3>表单组件</h3>
      <form action="">
        <label htmlFor="">name:</label>
        <input
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          type="text"
        />
        <label htmlFor="">password:</label>
        <input
          value={data.password}
          onChange={(e) => setData({ ...data, password: e.target.value })}
          type="text"
        />
        <label htmlFor="">email:</label>
        <input
          value={data.email}
          onChange={(e) => setData({ ...data, email: e.target.value })}
          type="text"
        />
      </form>
    </div>
  );
};
export default function ImperativeHandle() {
  const childRef = useRef<ChildHandle>(null);
  return (
    <div>
      <h2>父组件</h2>
      <button onClick={() => childRef.current?.validate()}>校验</button>
      <button onClick={() => childRef.current?.reset()}>reset</button>
      <hr />
      <Child ref={childRef} />
    </div>
  );
}
