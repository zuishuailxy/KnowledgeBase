import { BBH_Hegarty } from "next/font/google"; //引入字体库
const bbhSansHegarty = BBH_Hegarty({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export default function Page() {
  return (
    <div className={bbhSansHegarty.className}>
      <h1>Font Page</h1>
      <p>This is the font page.</p>
    </div>
  );
}
