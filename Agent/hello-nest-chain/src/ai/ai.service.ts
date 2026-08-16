import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateAiDto } from './dto/create-ai.dto';
import { UpdateAiDto } from './dto/update-ai.dto';
import { ChatOpenAI } from '@langchain/openai';
import type { Runnable } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';

@Injectable()
export class AiService {
  private readonly chain: Runnable;

  constructor(
    private readonly configService: ConfigService,
    // 用构造函数注入 CHAT_MODEL：构造函数执行前已注入完成，可直接使用
    // （属性注入 @Inject 是在构造函数执行完之后才注入，构造函数里用会拿到 undefined）
    @Inject('CHAT_MODEL') private readonly model: ChatOpenAI,
  ) {
    const prompt = PromptTemplate.fromTemplate('请回答以下问题：\n\n{query}');
    this.chain = prompt.pipe(this.model).pipe(new StringOutputParser());
  }

  async runChain(query: string): Promise<string> {
    return this.chain.invoke({ query });
  }

  async *streamChain(query: string): AsyncGenerator<string> {
    const stream = await this.chain.stream({ query });
    for await (const chunk of stream) {
      yield chunk;
    }
  }
}
