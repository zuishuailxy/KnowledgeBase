'use client'
import { useParams } from "next/navigation"

export default function Page() {
  const params = useParams();
  console.log(params);
  return (
    <div>
      <h1 className="block">Shop Page</h1>
      <p className="block">id: {params.id}</p>
    </div>
  )
}