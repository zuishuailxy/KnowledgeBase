import Link from "next/link";

const getData = async () => {
  await new Promise(resolve => setTimeout(resolve, 3000));
  return "This is Blog A";
}

export default function BlogA() {
  const data = getData();
  // throw new Error("This is a error");
  return (
    <div>
      <h1>{data}</h1>
      <Link href="/blog/b">返回Blog B</Link>
    </div>
  );
}