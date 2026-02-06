
// export const revalidate = 5 // 5秒后重新更新
//export const revalidate = 0 // 设置为0表示不缓存
export default async function PageCacheStrategy() {
    const randomImage = await fetch('https://www.loliapi.com/acg/pc?type=json', {cache: 'no-store'}) //这个接口随机返回一个二刺猿图片
    const data = await randomImage.json()
    console.log(data)
    return (
        <div>
            <h1>Strategy</h1>
            <img width={500} height={500} src={data.url} alt="random image" />
        </div>
    )

}