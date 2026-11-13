import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// The browser talks to this same-origin route; Django owns provider credentials.
export async function GET(request) {
  const incoming = new URL(request.url);
  const backend = process.env.DJANGO_API_URL || "http://127.0.0.1:8000/api";
  const target = new URL(`${backend}/feed/`);
  for (const [key, value] of incoming.searchParams) {
    if (key !== "type" && key !== "sources" && key !== "sortBy") target.searchParams.append(key, value);
  }
  if (incoming.searchParams.get("type") === "sources") {
    return NextResponse.json({ status: "ok", source: "django-feed", sources: [] });
  }
  if (incoming.searchParams.get("type") === "search") {
    target.searchParams.set("q", incoming.searchParams.get("q") || "");
  }
  try {
    const response = await fetch(target, {
      headers: request.headers.get("authorization") ? { authorization: request.headers.get("authorization") } : {},
      cache: "no-store",
    });
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return NextResponse.json({ status: "error", detail: "The Chronicle backend is unavailable." }, { status: 503 });
  }
}
