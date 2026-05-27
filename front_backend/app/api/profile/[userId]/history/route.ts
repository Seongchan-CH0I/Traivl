import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

// GET /api/profile/[userId]/history
// 해당 유저의 AI 사용 기록 최신순 반환
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const logs = await prisma.aiUsageLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching AI usage history:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI usage history" },
      { status: 500 }
    );
  }
}

// POST /api/profile/[userId]/history
// AI 기능 사용 완료 시 새로운 기록 추가
export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    // Request body 파싱
    const body = await req.json();
    const { type, title, content, icon } = body;

    if (!userId || !type || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields (type, title, content)" },
        { status: 400 }
      );
    }

    // 유저가 실제 존재하는지 먼저 확인
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 로그 생성
    const log = await prisma.aiUsageLog.create({
      data: {
        userId,
        type,
        title,
        content,
        icon: icon || "🤖", // 아이콘이 없으면 기본 로봇 아이콘 사용
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Error creating AI usage log:", error);
    return NextResponse.json(
      { error: "Failed to create AI usage log" },
      { status: 500 }
    );
  }
}
