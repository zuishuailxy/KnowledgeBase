import fs from "node:fs"

export default async function CachePage() {
  const data = fs.readFileSync("./data.json", "utf-8");
  const jsonData = JSON.parse(data);
  console.log("Cached Data:", jsonData);
  return (
    <div>
      <h1>这是一个启用了组件缓存的页面</h1>
      <p>当你多次访问这个页面时，组件的状态会被缓存，从而提升性能。</p>
    </div>
  );
}