import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  console.log(searchParams);
  return NextResponse.json({ message: "Get request success" });
}


export async function POST(req: NextRequest) {
  // const body = await req.formData(); //接受formData数据
  // const body = await req.text(); //接受text数据
  //const body = await request.arrayBuffer(); //接受arrayBuffer数据
  //const body = await request.blob(); //接受blob数据
  const body = await req.json(); //接受json数据
  console.log(body); //打印请求体中的数据
  return NextResponse.json({ message: 'Post request successful', body }, { status: 201 });
  //返回json数据


}