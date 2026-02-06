import { NextRequest, NextResponse } from 'next/server';
import { streamText, convertToModelMessages } from 'ai';
import { createDeepSeek, deepseek } from "@ai-sdk/deepseek";
import { DEEPSEEK_API_KEY } from '@/app/api/chat/key';

const deepSeek = createDeepSeek({
  apiKey: DEEPSEEK_API_KEY, //设置API密钥
});

export async function POST(req: NextRequest) {
  const { messages } = await req.json(); //获取请求体
  //这里为什么接受messages 因为我们使用前端的useChat 他会自动注入这个参数，所有可以直接读取
  const result = streamText({
    model: deepSeek('deepseek-chat'),
    messages: await convertToModelMessages(messages), //转换为模型消息
    system: '你是一个程序专家，请根据用户的问题给出回答', //系统提示词
  })

  return result.toUIMessageStreamResponse(); //返回流式响应
}