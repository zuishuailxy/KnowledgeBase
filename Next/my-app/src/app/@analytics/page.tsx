'use client'
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const getData = async () => {
  await delay(1000)
  return 'Analytics Data'
}

export default function Page() {
    return (
        <div>
            <h1 className="block">Analytics Page</h1>
            <p>{getData()}</p>
        </div>
    )
}