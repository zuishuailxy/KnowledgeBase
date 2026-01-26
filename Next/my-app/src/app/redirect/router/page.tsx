'use client'
import { useRouter } from "next/navigation"
export default function Page() {
    const router = useRouter()
    return (
        <>
        <button className="block" onClick={() => router.push("/about")}>跳转about页面</button>
        <button className="flex" onClick={() => router.replace("/about")}>替换当前页面</button>
        <button className="flex" onClick={() => router.back()}>返回上一页</button>
        <button className="flex" onClick={() => router.forward()}>跳转下一页</button>
        <button className="flex" onClick={() => router.refresh()}>刷新当前页面</button>
        <button className="flex" onClick={() => router.prefetch("/about")}>预获取about页面</button>
        </>
    )
}
