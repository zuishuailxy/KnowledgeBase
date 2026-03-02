"use client";

import { locales } from "@dict/index";
import { usePathname, useRouter } from "next/navigation";

export default function SwitchI18n({ lang }: { lang: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const localeLabels: Record<string, string> = {
    zh: "中文",
    en: "English",
    ja: "日本語",
    ko: "한국어",
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value; // 获取新语言
    const newPath = pathname.replace(`/${lang}`, `/${newLang}`); // 替换语言
    router.replace(newPath); // 跳转新路径
  };

  return (
    <div className="mb-4 flex items-center space-x-2">
      <label htmlFor="i18n-switch" className="text-gray-600 font-medium">
        🌐 语言:
      </label>
      <div className="relative">
        <select
          id="i18n-switch"
          className="appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-9 text-sm font-medium text-gray-800 shadow-sm transition-colors duration-150 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400"
          value={lang}
          onChange={handleChange}
        >
          {locales.map((locale) => (
            <option key={locale} value={locale} className="text-base">
              {localeLabels[locale] ?? locale}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
}
