import Image from "next/image";
import webp from "@/public/img265.webp";

export default function Page() {
  console.log(webp);

  return (
    <div>
      <h1>Image Page</h1>
      <p>This is the image page.</p>
      <Image src="/img265.webp" alt="Example Image" width={500} height={300} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 1200px"/>
      {/* <Image src={webp} alt="Example Image" /> */}
      {/* {Array.from({ length: 10 }).map((_, index) => (
        <Image
          key={index}
          src={`https://eo-img.521799.xyz/i/pc/img${index + 1}.webp`}
          width={1200}
          height={800}
          alt="内容图"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 1200px"
          // ↑ 手机上 100% 宽度，平板上 50%，桌面最大 1200px
        />
      ))} */}
    </div>
  );
}
