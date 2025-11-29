import { useStorage } from "../hooks/useStorage";
import { useHistory } from "../hooks/useHistory";

export default function SyncExternal() {
  const [count, setCount] = useStorage<number>("count", 0);
  const [url, push, replace] = useHistory();
  return (
    <>
      {/* storage */}
      <h1>value: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <hr />
      {/* history */}
      <h1>Current URL: {url}</h1>
      <button onClick={() => push("/new-path")}>Push New Path</button>
      <button onClick={() => replace("/replace-path")}>Replace Path</button>
    </>
  );
}
