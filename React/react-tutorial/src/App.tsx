import "./App.css";
import { Suspense } from "react";

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
// import Card from "./components/Card";
// import Card2 from "./components/Card2";
import ControledC from "./components/Controlled";
import { useState } from "react";
import Modal from "./components/Modal";
import { Skeleton } from "./components/Skeleton";
import Card3 from "./components/Card3";
import { AdminPage, UserPage } from "./components/HOC";
import { TrackButton } from "./components/HOC/track";
// import CButton from "./components/Button";

// state
import usePriceStore from "./store/price";
import Left from './pages/Left'
import Right from './pages/Right';
import useUserStore from "./store/user";

// router
import { RouterProvider } from "react-router";
import router from "./router";

function App() {
  const [val, setVal] = useState("");
  const update = (d: string) => {
    console.log(d);
    setVal(d);
  };
  const [showModal, setShowModal] = useState(false);
  const price = usePriceStore((state) => state.price);
  // const {gourds} = useUserStore();
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
      {/* {val}
      <Card title={"标题1"} cb={update}>
        <div>
          <i>我是内容</i>
          <p>我也是内容</p>
        </div>
      </Card> */}
      {/* <Card2 title={"标题2"}/> */}
      {/* <ControledC /> */}
      {/* <button onClick={() => setShowModal(true)}>123</button>
      {showModal && <Modal />} */}
      {/* <Suspense fallback={<Skeleton />}>
        <Card3 />
      </Suspense> */}
      {/* <AdminPage />
      <UserPage /> */}
      {/* <TrackButton /> */}
      {/* <CButton /> */}
      
      {/* router */}
      {/* <RouterProvider router={router} /> */}

      {/* zustand */}
      <div className="container">
        <h1>Zustand Demo</h1>
        <div className="wraps">
          <Left />
          <Right />
        </div>

      </div>
    </>
  );
}

export default App;
