import e from "express";

const app = e();
const port = process.argv[2] || 3000;

app.get("/info", (req, res) => {
  res.json({
    port,
    code: 200,
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Gateway Server",
    code: 200,
  });
});

app.listen(port, () => {
  console.log(`Gateway server is running at http://localhost:${port}`);
});
