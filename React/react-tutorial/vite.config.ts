import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import type { Plugin } from "vite";
import mockjs from "mockjs";
import url from "node:url";

const viteMockServer = (): Plugin => {
  return {
    name: "vite-mock-server",
    configureServer(server) {
      server.middlewares.use("/api/list", (req, res) => {
        const parseUrl = url.parse(req.originalUrl || "", true).query;
        const data = mockjs.mock({
          "list|1000": [
            {
              "id|+1": 1,
              name: parseUrl.name,
              address: "@county(true)",
            },
          ],
        });
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data));
      });
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), viteMockServer()],
  css: {
    modules: {
      localsConvention: "camelCaseOnly",
      generateScopedName: '[local]_[hash:base64:5]' 
    }
  }
});
