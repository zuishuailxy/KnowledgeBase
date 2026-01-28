"use client";
import Link from "next/link";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const checkLogin = async () => {
  const res = await fetch("/api/login");
  const data = await res.json();
  if (data.code === 1) {
    return true;
  } else {
    return false;
  }
};

export default function Home() {
  const arr = ["a", "b", "c", "d", "e"];
  const router = useRouter();

  useEffect(() => {
    const verify = async () => {
      const res = await checkLogin();
      if (!res) {
        router.push("/login");
      }
    }
    verify();
  }, [router]);



  return (
    // <div>
    //   <h1>Home Page</h1>
    //   <Link href="/about">About</Link>
    //   <br />
    //   <Link href={{ pathname: "/about", query: { name: "John", age: 18 } }}>
    //     跳转About并且传入参数
    //   </Link>
    //   <Link href="/page" prefetch={true} className="flex">
    //     预获取page页面
    //   </Link>
    //   <Link href="/xm" scroll={true} className="flex">
    //     保持滚动位置
    //   </Link>
    //   <Link href="/daman" replace={true} className="flex">
    //     替换当前页面
    //   </Link>
    //   <ul>
    //     {arr.map((item) => (
    //       <li key={item}>
    //         <Link href={`/blog/${item}`}>{item}</Link>
    //       </li>
    //     ))}
    //   </ul>
    // </div>

    <div>
      <h1>你已经登录进入home页面</h1>
    </div>
  );
}
