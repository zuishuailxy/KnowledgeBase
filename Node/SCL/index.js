import express from "express";
import qrcode from "qrcode";
import jwt from "jsonwebtoken";

const app = express();
const port = 3000;
const user = {};
const userId = 1;
app.use("/static", express.static("public"));
app.use(express.json());

// 1. Generate QR Code
app.get("/qrcode", async (req, res) => {
  user[userId] = {
    token: null,
    time: Date.now(),
  };

  const code = await qrcode.toDataURL(
    "http://192.168.3.229:3000/static/mandate.html?userId=" + userId
  );
  res.json({ code, userId });
});

app.post("/login/:userId", (req, res) => {
  const id = req.params.userId;
  const token = jwt.sign({ userId }, "token");

  user[id].token = token;
  user[id].time = Date.now();
  res.json({ token });
});

app.get("/check/:userId", (req, res) => {
  const id = req.params.userId;
  if (user[id] && user[id].token) {
    const time = Date.now() - user[id].time;
    if (time < 1000 * 60 * 1) {
      res.json({ status: 1, token: user[id].token }); // Token valid
    } else {
      res.json({ status: 2 }); // Token expired
    }
  } else {
    res.json({ status: 0 }); // No token
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
