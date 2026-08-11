import { createModel } from "../../utils/create-model.mjs";
import { z } from "zod";

// 初始化模型
const model = createModel();
// 定义结构化输出的 schema
const scientistSchema = z.object({
  name: z.string().describe("科学家的全名"),
  birth_year: z.number().describe("出生年份"),
  death_year: z.number().optional().describe("去世年份，如果还在世则不填"),
  nationality: z.string().describe("国籍"),
  fields: z.array(z.string()).describe("研究领域列表"),
  achievements: z.array(z.string()).describe("主要成就"),
  biography: z.string().describe("简短传记"),
});

// 绑定工具到模型
const modelWithTool = model.bindTools([
  {
    name: "extract_scientist_info",
    description: "提取和结构化科学家的详细信息",
    schema: scientistSchema,
  },
]);

try {
  console.log("📡 实时输出流式内容:\n");

  // 手动累加流式工具调用参数。
  // ⚠️ 本网关流式增量参数不带 id，JsonOutputToolsParser 无法按 id 合并（结果 args 为空），
  //    因此直接累加 additional_kwargs.tool_calls[].function.arguments 增量。
  const stream = await modelWithTool.stream("详细介绍牛顿的生平和成就");

  let argsAccum = ""; // 累加 JSON 参数片段
  for await (const chunk of stream) {
    const toolCalls = chunk.additional_kwargs?.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      for (const tc of toolCalls) {
        const delta = tc.function?.arguments;
        if (delta) {
          argsAccum += delta;
          process.stdout.write(delta); // 实时输出参数增量
        }
      }
    }
  }

  console.log("\n\n✅ 流式输出完成");

  // 解析完整参数为结构化对象
  const finalArgs = JSON.parse(argsAccum);
  console.log("\n📊 最终结构化结果:");
  console.log(JSON.stringify(finalArgs, null, 2));
} catch (error) {
  console.error("\n❌ 错误:", error.message);
  console.error(error);
}
