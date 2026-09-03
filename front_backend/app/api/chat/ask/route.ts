// Next.js App Router — FastAPI SSE 스트림 프록시
// FastAPI의 SSE 응답을 그대로 클라이언트에 전달합니다.

// SSE 스트리밍이라 응답이 끝날 때까지 함수가 살아있어야 함
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json();
  const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://localhost:8000";

  try {
    const response = await fetch(`${AI_ENGINE_URL}/api/v1/chat/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "AI 서버 응답 오류", status: response.status }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // FastAPI의 SSE 스트림을 그대로 클라이언트에 전달
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat proxy error:", error);
    return new Response(
      JSON.stringify({ error: "AI 서버에 연결할 수 없습니다." }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
