import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hashPassword } from '../../../../lib/auth';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, password } = body;

        // 필수 필드 검증
        if (!id || !password) {
            return NextResponse.json(
                { success: false, message: '아이디와 비밀번호를 모두 입력해주세요.' },
                { status: 400 }
            );
        }

        // 아이디로 사용자 조회
        const user = await prisma.user.findUnique({
            where: { id: id.trim() },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' },
                { status: 400 }
            );
        }

        // 비밀번호 검증 (소셜 로그인 등으로 가입하여 password가 없는 계정 방어)
        if (!user.password) {
            return NextResponse.json(
                { success: false, message: '비밀번호 로그인 방식을 사용할 수 없는 계정입니다.' },
                { status: 400 }
            );
        }

        const hashedPassword = hashPassword(password);
        if (user.password !== hashedPassword) {
            return NextResponse.json(
                { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' },
                { status: 400 }
            );
        }

        // 비밀번호를 제외하고 유저 정보 반환
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(
            { success: true, user: userWithoutPassword, message: '로그인에 성공했습니다!' },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Login API error:', error);
        return NextResponse.json(
            { success: false, message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
            { status: 500 }
        );
    }
}
