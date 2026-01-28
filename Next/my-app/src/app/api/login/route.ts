import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.username === 'admin' && body.password === '123456') {
    const cookieStore = await cookies()
    cookieStore.set('token', '123456', {
      httpOnly: true, //只允许在服务器端访问
      maxAge: 60 * 60 * 24 * 30, //30天
    })

    return NextResponse.json({ code: 1 }, { status: 200 })
  } else {
    return NextResponse.json({ code: 0 }, { status: 401 })
  }
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')
  if (token && token.value === "123456") {
    return NextResponse.json({ code: 1 }, { status: 200 });
  } else {
    return NextResponse.json({ code: 0 }, { status: 401 })
  }

}