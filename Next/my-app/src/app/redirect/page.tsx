import { redirect } from "next/navigation"
const checkLogin = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return true
}
export default async function Page() {
   const isLogin = await checkLogin()
   //如果用户未登录，则跳转到登录页面
   if (!isLogin) {
    redirect("/login")
   }
   return (
    <div>
        <h1 className="block">Logined Page</h1>
    </div>
   )
}
