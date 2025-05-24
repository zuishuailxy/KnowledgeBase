import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // 切片存储目录
  },
  filename: (req, file, cb) => {
    cb(null, `${req.body.index}-${req.body.filename}`); // 使用原始文件名
  },
});

const upload = multer({ storage });
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post("/upload", upload.single("movieFile"), (req, res) => {
  res.json({ message: "File uploaded successfully" });
});

app.post("/merge", (req, res) => {
  const uploadDir = path.join(process.cwd(), "uploads");
  const videoPath = path.join(process.cwd(), "video", `${req.body.filename}`);
  const dirs = fs.readdirSync(uploadDir).sort((a, b) => {
    return a.split("-")[0] - b.split("-")[0];
  });
  dirs.forEach((file) => {
    fs.appendFileSync(videoPath, fs.readFileSync(path.join(uploadDir, file)));
    fs.unlinkSync(path.join(uploadDir, file)); // 删除切片
  });

  res.json({ message: "File merged successfully" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
