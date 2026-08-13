// 放所有的工具
// 读： read-file
// 写： write-file
// 剩余的可以用 bash 命令来代替

import { tool } from "@langchain/core/tools";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { z } from "zod";

// 1. 读取文件工具
// 注意：入参命名为 filePath，避免遮蔽顶部 import 的 node:path 模块
const readFileTool = tool(
  async ({ filePath }) => {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      console.log(
        `[Tool] Read file content from ${filePath}, the length is`,
        content.length,
      );
      return `file content: ${content}`;
    } catch (error) {
      console.error(
        `[Tool] Error reading file from ${filePath}:`,
        error.message,
      );
      //   throw new Error(`Failed to read file from ${filePath}`);
      return `Error reading file from ${filePath}: ${error.message}`;
    }
  },
  {
    name: "read_file",
    description:
      "当用户需要读取文件内容，查看代码，分析文件内容时使用此工具。输入为文件路径(相对或者绝对路径)，输出为文件内容。",
    schema: z.object({
      filePath: z.string().describe("The path to the file to read"),
    }),
  },
);

// 2. 写入文件工具
// 注意：入参命名为 filePath，避免遮蔽顶部 import 的 node:path 模块
// 之前命名为 path 时，path.dirname(path) 里的 path 是字符串入参，不是模块，导致报错
const writeFileTool = tool(
  async ({ filePath, content }) => {
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true }); // 确保目录存在
      await fs.writeFile(filePath, content, "utf-8");
      console.log(
        `[Tool] Written content to ${filePath}, the length is`,
        content.length,
      );
      return `File written successfully to ${filePath}`;
    } catch (error) {
      console.error(`[Tool] Error writing file to ${filePath}:`, error.message);
      return `Error writing file to ${filePath}: ${error.message}`;
    }
  },
  {
    name: "write_file",
    description:
      "当用户需要创建新文件或覆盖写入文件内容时使用此工具。输入为文件路径(相对或者绝对路径)和要写入的内容，如果路径不存在，请自动创建目录。输出为写入结果。",
    schema: z.object({
      filePath: z
        .string()
        .describe("The path of the file to write (relative or absolute)"),
      content: z.string().describe("The content to write to the file"),
    }),
  },
);

// 3. 执行 bash 命令工具，带实时输出
const executeCommandTool = tool(
  // 工具的实际执行函数
  // 参数说明：
  //   command  : 要执行的 shell 命令字符串（如 "npm run build"、"ls -la | grep src"）
  //   cwd      : 命令的工作目录，默认当前进程目录（process.cwd()）
  //   timeoutMs: 超时时间（毫秒），默认 30 秒，防止命令卡死拖垮整个 Agent
  async ({ command, cwd = process.cwd(), timeoutMs = 30000 }) => {
    try {
      // spawn：以子进程方式执行命令
      //   shell: true   -> 把整串命令交给系统的 shell 解析，因此支持管道 |、重定向 >、&& 等语法
      //   stdio         -> ["ignore", "pipe", "pipe"]：
      //                    stdin 忽略（命令无需交互输入），stdout/stderr 用管道捕获（才能做实时输出）
      //   env           -> 继承父进程环境变量，保证 PATH 等可用
      const child = spawn(command, {
        cwd,
        shell: true,
        stdio: ["ignore", "pipe", "pipe"],
        env: process.env,
      });

      // 用于累计命令的输出内容（后面要拼进返回给模型的结果里）
      let stdout = "";
      let stderr = "";
      // 保存定时器句柄，超时时用来清理
      let timeoutHandle = null;

      // 实时输出：stdout 数据一到就同时做两件事
      // 1. 追加进 stdout 字符串（供最终结果返回）
      // 2. 立即写入当前进程的标准输出，让人/终端能实时看到进度
      child.stdout.on("data", (chunk) => {
        const text = chunk.toString();
        stdout += text;
        process.stdout.write(text);
      });

      // 同上，但针对 stderr（错误输出），写到当前进程的 stderr
      child.stderr.on("data", (chunk) => {
        const text = chunk.toString();
        stderr += text;
        process.stderr.write(text);
      });

      // 用 Promise 包装子进程的结束事件，等待命令执行完成
      const exitCode = await new Promise((resolve, reject) => {
        // 启动超时定时器：到时间就强杀子进程并让 Promise 报错
        timeoutHandle = setTimeout(() => {
          child.kill("SIGTERM"); // 先发 SIGTERM 优雅终止
          reject(new Error(`Command timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        // spawn 本身出错（如命令不存在、cwd 无效）时触发
        child.on("error", reject);

        // 子进程正常结束时触发（code 为退出码，0 表示成功）
        child.on("close", (code) => {
          clearTimeout(timeoutHandle); // 命令已结束，清掉定时器
          resolve(code ?? 1); // code 可能为 null（被信号终止），兜底按失败处理
        });
      });

      // 退出码非 0 视为执行失败，把错误码 + 输出一起返回给模型，方便它排查
      if (exitCode !== 0) {
        return `Command failed with exit code ${exitCode}.\nstdout:\n${stdout}\nstderr:\n${stderr}`;
      }

      // 执行成功，同样返回完整输出（stdout/stderr 已实时打印过）
      return `Command succeeded with exit code ${exitCode}.\nstdout:\n${stdout}\nstderr:\n${stderr}`;
    } catch (error) {
      // 兜底：超时、spawn 报错等异常都在这里接住
      // 不 throw，而是把错误信息作为字符串返回，让模型能感知到失败并继续对话
      console.error(`[Tool] Error executing command:`, error.message);
      return `Error executing command: ${error.message}`;
    }
  },
  {
    name: "execute_command",
    description:
      "当用户需要在当前环境执行 shell/bash 命令、查看运行结果、进行文件操作或构建验证时使用此工具。输入为要执行的命令字符串，支持实时输出。输出为命令执行结果。",
    schema: z.object({
      command: z.string().describe("The shell command to execute"),
      cwd: z.string().optional().describe("Working directory for the command"),
      timeoutMs: z
        .number()
        .optional()
        .describe("Timeout in milliseconds for the command"),
    }),
  },
);

const tools = [readFileTool, writeFileTool, executeCommandTool];

export { readFileTool, writeFileTool, executeCommandTool, tools };
