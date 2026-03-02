export type Dictionary = {
    title: string
    description: string
    keywords: string
}
export const locales = ['en', 'zh','ja','ko'] // 支持的语言
export const defaultLocale = 'zh'
export async function getDictionary(locale: string): Promise<Dictionary> {
    const module = await import(`./${locale}.json`)
    return module.default
}