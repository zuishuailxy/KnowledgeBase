import { getDictionary } from "@dict/index";
import SwitchI18n from "./switchI18n";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return (
    <div className='p-4 flex flex-col items-center justify-center border-2 border-gray-300 rounded-md'>
    <SwitchI18n lang={lang} />
    <h1 className='text-2xl font-bold text-center'>{dict.title}</h1>
    <p className='text-gray-500 text-center'>{dict.description}</p>
    <p className='text-gray-500'>{dict.keywords}</p>
  </div>
  );
}
