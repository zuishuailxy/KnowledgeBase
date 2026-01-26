
import Link from "next/link";

export default function Home() {
  const arr = ["a", "b", "c", "d", "e"]
  return (
    <div>
      <h1>Home Page</h1>
      <Link href="/about">About</Link>
      <br />
      <Link href={{pathname: '/about', query: {name: 'John', age: 18}}}>跳转About并且传入参数</Link>
      <Link href="/page" prefetch={true} className="flex">预获取page页面</Link>
      <Link href="/xm" scroll={true} className="flex">保持滚动位置</Link>
      <Link href="/daman" replace={true} className="flex">替换当前页面</Link>
      <ul>
        {arr.map((item) => (
          <li key={item}><Link href={`/blog/${item}`}>{item}</Link></li>
        ))}
      </ul>
    </div >
  )
}
