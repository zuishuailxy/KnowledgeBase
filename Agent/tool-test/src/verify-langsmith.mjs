import "dotenv/config";
import { createModel } from "./create-mode.mjs";

const model = createModel(0.2);
const res = await model.invoke("用一句话介绍你自己");
console.log("模型回复:", res.content);
console.log("验证完成");
