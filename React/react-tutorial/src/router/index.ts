import { createBrowserRouter } from "react-router";
import Home from "../pages/Home";
import About from "../pages/About";

const data = [
  { name: "leo", age: 18 },
  { name: "lily", age: 20 },
  { name: "lucy", age: 22 },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const router = createBrowserRouter([
  {
    path: "/",
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
    path: "/about",
    Component: About,
  },
]);

export default router;
