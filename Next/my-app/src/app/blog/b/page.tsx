import Link from "next/link";

export default function BlogB() {
  return (
    <div>
      <h1>This is Blog B</h1>
      <Link href="/blog/a">返回 Blog A</Link>
    </div>
  )
}