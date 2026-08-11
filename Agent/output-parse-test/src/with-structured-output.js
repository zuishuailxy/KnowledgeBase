import { createModel } from "../../utils/create-model.mjs";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

// 初始化模型
const model = createModel();

// 定义结构化输出的 schema
const scientistSchema = z.object({
  name: z.string().describe("科学家的全名"),
  birth_year: z.number().describe("出生年份"),
  nationality: z.string().describe("国籍"),
  fields: z.array(z.string()).describe("研究领域列表"),
});

// 使用 withStructuredOutput 方法
// method: "functionCalling" 通过工具调用强制模型严格按 schema 输出
// （前提：create-model.mjs 已关闭 thinking 模式 enable_thinking:false，
//  否则 Qwen 网关会拒绝 tool_choice: required）
const structuredModel = model.withStructuredOutput(scientistSchema, {
  method: "functionCalling",
});

const result = await structuredModel.invoke("介绍一下爱因斯坦");

console.log("结构化结果:", JSON.stringify(result, null, 2));
console.log(`\n姓名: ${result.name}`);
console.log(`出生年份: ${result.birth_year}`);
console.log(`国籍: ${result.nationality}`);
console.log(`研究领域: ${result.fields.join(", ")}`);
