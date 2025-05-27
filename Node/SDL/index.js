import express from "express";
import { WebSocketServer } from "ws";
import cors from "cors";

const app = express();
const port = 3000;

app.use(cors());

const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const wss = new WebSocketServer({ server });
const connection = {};
wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    if (data.action === "login") {
      // 已经有设备登陆过
      const oldConnection = connection[data.id];

      if (oldConnection && oldConnection.fingerprint) {
        oldConnection.socket.send(
          JSON.stringify({
            action: "logout",
            message: `You have been logged out due to a new login by ${new Date().toLocaleString()}.`,
          })
        );
        oldConnection.socket.close();
        // 更新连接
        oldConnection.socket = ws;
        console.log("Existing device logged out due to new login");
      } else {
        // 第一次登陆
        console.log("New device login detected");
        connection[data.id] = {
          socket: ws,
          fingerprint: data.fingerprint,
        };
      }
    }
  });
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
