import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
@Module({
  controllers: [AiController],
  providers: [
    AiService,
    {
      provide: 'CHAT_MODEL',
      useFactory: (configService: ConfigService) => {
        return new ChatOpenAI({
          model: configService.get<string>('QWEN_MODEL_NAME'),
          apiKey: configService.get<string>('API_KEY'),
          configuration: {
            baseURL: configService.get<string>('BASE_URL'),
          },
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class AiModule {}
