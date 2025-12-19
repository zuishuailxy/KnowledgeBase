import { createBrowserRouter } from "react-router";
import Layout from "../layout";
import Home from "../pages/Home";
import About from "../pages/About";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const router = createBrowserRouter([
  {
    // path: "/index",
    Component: Layout,
    children: [
      {
        path: "home",
        // index: true,
        // Component: Home,
        lazy: async () => {
          await sleep(3000);
          const module = await import("../pages/Home");
          console.log(module);
          return { Component: module.default };
        },
      },
      {
        path: "about",
        Component: About,
      }
    ]
  }
])

export default router;