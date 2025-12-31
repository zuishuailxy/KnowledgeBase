import { createBrowserRouter } from "react-router";
import Layout from "../layout";
import Home from "../pages/Home";
import About from "../pages/About";
import NotFound from "../pages/NotFound";
import Error from "../pages/Error";

const data = [
  { name: "leo", age: 18 },
  { name: "lily", age: 20 },
  { name: "lucy", age: 22 },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        path: "home",
        Component: Home,
        loader: async () => {
          await sleep(1000);
          return {
            data,
            success: true,
          };
        },
        action: async ({ request }) => {
          const jsonData = await request.json();
          // const jsonData = Object.fromEntries(formData.entries());
          console.log("Submitted data:", jsonData);
          await sleep(1000);
          data.push({ name: jsonData.username, age: Number(jsonData.age) });
          return { success: true };
        },
      },
      {
        path: "about",
        Component: About,
        loader: async () => {
          await sleep(500);
          throw new Response("Not Found", { status: 404, statusText: "Not Found" });
        },
        ErrorBoundary:Error,
      },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  }
]);

export default router;
