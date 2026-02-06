import { Suspense } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
// import { cacheLife } from "next/cache";

const DynamicContent = async () => {
  // 'use cache';
  // cacheLife("hours"); 
  // cacheLife({stale: 30, revalidate: 5, expire: 10}) //使用自定义参数
  const data = await fetch("https://www.mocklib.com/mock/random/name");
  const jsonData = await data.json();
  console.log("Fetched Suspense Data:", jsonData);
  // const cookieStore = await cookies();
  // console.log("Cookies:", cookieStore);
  // await connection();
  const random = Math.random();
  const now = Date.now();
  console.log(random, now);

  return (
    <div>
      <h2>动态内容:</h2>
      <ul>
        <li>名字: {jsonData.name}</li>
        <li>随机数: {random}</li>
        <li>当前时间: {now}</li>
      </ul>
    </div>
  );
};

export default function SuspenseCachePage() {
  return (
    <div>
      <h1>Home</h1>
      <Suspense fallback={<div>动态内容Loading...</div>}>
        <DynamicContent />
      </Suspense>
    </div>
  );
}
