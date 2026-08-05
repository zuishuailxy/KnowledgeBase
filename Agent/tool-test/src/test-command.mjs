import { spawn } from "node:child_process";

// 使用管道时：整串命令交给 shell 解析，不 split、不传 args（避免 DEP0190 警告）
const command =
  'printf "n\\nn\\n" | pnpm create vite react-todo-app --template react-ts';

const child = spawn(command, {
  cwd: process.cwd(),
  stdio: "inherit", // 实时输出到控制台
  shell: true, // 允许使用管道符和重定向符
});

let errorMsg = "";
child.on("error", (err) => {
  errorMsg = err.message;
});

child.on("close", (code) => {
  if (code !== 0) {
    process.exit(0);
  } else {
    if (errorMsg) {
      console.error("Error:", errorMsg);
    }
    process.exit(code || 1);
  }
});
