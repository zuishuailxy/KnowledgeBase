import axios from "axios";

export const get = axios.get("https://api.github.com/repos/axios/axios");
export const post = axios.post(
  "https://api.github.com/repos/axios/axios/issues",
  {
    title: "New Issue",
    body: "This is a new issue created via axios post request.",
  }
);
