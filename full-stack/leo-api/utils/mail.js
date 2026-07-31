const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const path = require("path");
const { QUEUES, publish } = require("./rabbitmq");
const logger = require("./logger");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.MAILER_HOST,
  port: Number(process.env.MAILER_PORT) || 587,
  secure: process.env.MAILER_SECURE === "true",
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASS,
  },
});

// 注册 Handlebars 模板引擎
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

/**
 * 发送邮件
 * @param {Object} options
 * @param {string|string[]} options.to - 收件人
 * @param {string} options.subject - 主题
 * @param {string} options.template - 模板名（不含 .hbs）
 * @param {Object} [options.context] - 模板变量
 */
async function sendMail({ to, subject, template, context = {} }) {
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
  logger.info(`[邮件已发送] ${info.messageId}`);
  return info;
}

/**
 * 通过消息队列发送邮件（异步，不阻塞）
 */
async function sendMailViaQueue({ to, subject, template, context = {} }) {
  await publish(QUEUES.MAIL, {
    to,
    subject,
    template,
    context,
  });
  logger.info(`[邮件已入队] ${to}`);
}

module.exports = { sendMail, sendMailViaQueue };
