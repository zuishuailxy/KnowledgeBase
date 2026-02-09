"use client";
import { useActionState } from "react";
import { handleLogin } from "../lib/login/actions";

const initialState = {
  message: "",
};

export default function NewLoginPage() {
  //   const handleLogin = async (id: number, formData: FormData) => {
  //     "use server";
  //     const username = formData.get("username");
  //     const password = formData.get("password");
  //     const form = Object.fromEntries(formData);
  //     console.log("Username:", username);
  //     console.log("Password:", password, form, id);
  //   };

  //   // 利用bind 方法创建一个新的函数，并将id参数绑定为1。当调用userFunction时，它会自动传递id参数的值为1，同时还可以接受其他参数（如formData）。这样，handleLogin函数在被调用时就会接收到预设的id参数值。
  //   const userFunction = handleLogin.bind(null, 1); //绑定id参数

  const [state, userFunction, isPending] = useActionState(
    handleLogin,
    initialState,
  );

  return (
    <div>
      <h1>登录页面</h1>
      {isPending && <p>正在登录...</p>}
      {state.message && <p className="text-red-600">{state.message}</p>}
      <div className="flex flex-col gap-2 w-75 mx-auto mt-30">
        <form action={userFunction} className="flex flex-col gap-2">
          <input
            className="border border-gray-300 rounded-md p-2"
            name="username"
            placeholder="Username"
          ></input>
          <input
            className="border border-gray-300 rounded-md p-2"
            name="password"
            type="password"
            placeholder="Password"
          ></input>
          <button
            className="bg-blue-500 text-white rounded-md p-2"
            type="submit"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
