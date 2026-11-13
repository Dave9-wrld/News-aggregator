import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function proxy(request, context) {
  const { path } = await context.params;
  const backend = process.env.DJANGO_API_URL || "http://127.0.0.1:8000/api";
  const source = new URL(request.url);
  const target = new URL(`${backend}/${path.join("/")}/`);
  target.search = source.search;
  const headers = {};
  for (const name of ["authorization", "content-type"]) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }
  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });
    return new NextResponse(await response.text(), { status: response.status, headers: { "content-type": response.headers.get("content-type") || "application/json" } });
  } catch {
    return NextResponse.json({ detail: "The Chronicle backend is unavailable." }, { status: 503 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
