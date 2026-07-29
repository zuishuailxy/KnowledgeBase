const amqp = require("amqplib");
require("dotenv").config();

const RABBITMQ_URL = process.env.RABBITMQ_URL;

const QUEUES = {
  MAIL: "mail_queue",
};

let connection = null;
let channel = null;

async function getChannel() {
  if (channel) return channel;

  connection = await amqp.connect(RABBITMQ_URL);
  connection.on("close", () => {
    channel = null;
    connection = null;
  });

  channel = await connection.createChannel();
  await channel.assertQueue(QUEUES.MAIL, { durable: true });
  return channel;
}

/**
 * 发布消息到队列
 */
async function publish(queue, data) {
  const ch = await getChannel();
  const msg = JSON.stringify(data);
  ch.sendToQueue(queue, Buffer.from(msg), { persistent: true });
}

/**
 * 消费队列消息
 * @param {Function} handler - (data, msg) => void，抛出异常自动 nack 重新入队
 */
async function consume(queue, handler) {
  const ch = await getChannel();
  ch.prefetch(1);

  ch.consume(
    queue,
    async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString());
        await handler(data, msg);
        ch.ack(msg);
      } catch (err) {
        console.error(`[MQ] ${queue} 处理失败:`, err.message);
        ch.nack(msg, false, true); // 重新入队
      }
    },
    { noAck: false },
  );

  console.log(`[MQ] 开始消费: ${queue}`);
}

/**
 * 关闭连接
 */
async function close() {
  if (channel) await channel.close();
  if (connection) await connection.close();
  channel = null;
  connection = null;
}

module.exports = { QUEUES, publish, consume, close };
