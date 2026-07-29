#!/usr/bin/env node
/**
 * 邮件发送 Worker
 * 启动: node workers/mail-worker.js
 */

const { QUEUES, consume } = require("../utils/rabbitmq");
const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const path = require("path");
require("dotenv").config();

// 创建独立的 transporter（Worker 专用）
const transporter = nodemailer.createTransport({
  host: process.env.MAILER_HOST,
  port: Number(process.env.MAILER_PORT) || 587,
  secure: process.env.MAILER_SECURE === "true",
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASS,
  },
});

transporter.use(
  "compile",
  hbs({
    viewEngine: {
      extname: ".hbs",
      layoutsDir: path.join(__dirname, "../emails/layouts"),
      partialsDir: path.join(__dirname, "../emails/partials"),
      defaultLayout: "default",
    },
    viewPath: path.join(__dirname, "../emails"),
    extName: ".hbs",
  }),
);

async function main() {
  await consume(QUEUES.MAIL, async (data) => {
    const { to, subject, template, context = {} } = data;

    const info = await transporter.sendMail({
      from: process.env.MAILER_FROM || process.env.MAILER_USER,
      to,
      subject,
      template,
      context: {
        ...context,
        projectName: process.env.PROJECT_NAME || "Leo 教育",
        siteUrl: process.env.SITE_URL || "http://localhost:3000",
        year: new Date().getFullYear(),
      },
    });

    console.log(`[邮件已发送] ${info.messageId} → ${to}`);
  });

  console.log("[Mail Worker] 已启动");
}

main().catch((err) => {
  console.error("[Mail Worker] 启动失败:", err);
  process.exit(1);
});
