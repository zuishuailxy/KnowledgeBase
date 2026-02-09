"use server";

import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(6, "用户名不能少于6位"),
  password: z.string().min(6, "密码不能少于6位"),
});

export async function handleLogin(_prevState: any, formData: FormData) {
  const result = loginSchema.safeParse(Object.fromEntries(formData)); //调用zod的safeParse方法进行校验
  if (!result.success) {
    const errorMessage = z.treeifyError(result.error).properties; //调用zod的treeifyError方法将错误信息转换为对象
    let errorStr = "";
    Object.entries(errorMessage!).forEach(([_, value]) => {
      errorStr += `${value.errors.join(", ")}\n`; //将错误信息拼接成字符串
    });

    return {
      message: errorStr,
    };
  }

  return {
    message: "登录成功",
  };
}
