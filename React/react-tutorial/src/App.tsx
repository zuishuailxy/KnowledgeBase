import "./App.css";
import Cart from "./components/Cart";
import PersonImmer from "./components/PersonImmer";
import SyncExternal from "./components/SyncExternal";
import Transition from "./components/Transition";
import DeferredValue from "./components/DeferredValue";
import Effect from "./components/Effect";
import Layout from "./components/Layout";
import RefC from "./components/RefC";
import ImperativeHandle from "./components/ImperativeHandle";
import Context from "./components/Context";
import MemoC from "./components/MemoC";
import Callback from "./components/Callback";
import WaterMark from "./components/WaterMark";
import Card from "./components/Card";
import { useState } from "react";

const [val, setVal] = useState("");

const update = (d: string) => {
  setVal(d);
};

function App() {
  return (
    <>
      {/* <Cart /> */}
      {/* <PersonImmer /> */}
      {/* <SyncExternal /> */}
      {/* <Transition /> */}
      {/* <DeferredValue /> */}
      {/* <Effect /> */}
      {/* <Layout /> */}
      {/* <RefC /> */}
      {/* <ImperativeHandle /> */}
      {/* <Context /> */}
      {/* <MemoC /> */}
      {/* <Callback /> */}
      {/* <WaterMark /> */}
      {val}
      <Card title={"标题1"} cb={() => update}>
        <div>
          <i>我是内容</i>
          <p>我也是内容</p>
        </div>
      </Card>
    </>
  );
}

export default App;
