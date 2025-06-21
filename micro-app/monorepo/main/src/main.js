import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { get, post } from "@demo/common";
import { preloadApp } from "wujie";
import wujie from "wujie-vue3";
// import wujie from "../../../principle/esm/src/index";

preloadApp({
  name: "vue3",
  url: "http://localhost:5174",
  exec: true,
});
preloadApp({
  name: "react",
  url: "http://localhost:5175",
  exec: true,
});

const app = createApp(App);
app.use(wujie);
app.mount("#app");
