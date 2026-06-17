import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hashPassword } from '../../../../lib/auth';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, email, name, password } = body;

        // 필수 필드 검증
        if (!id || !email || !name || !password) {
            return NextResponse.json(
                { success: false, message: '모든 필드(아이디, 이메일, 이름, 비밀번호)를 입력해주세요.' },
                { status: 400 }
            );
        }

        // 아이디 형식 검증 (공백 불가, 3글자 이상 등)
        if (id.trim().length < 3) {
            return NextResponse.json(
                { success: false, message: '아이디는 최소 3글자 이상이어야 합니다.' },
                { status: 400 }
            );
        }

        // 이메일 형식 간단 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, message: '올바른 이메일 형식을 입력해주세요.' },
                { status: 400 }
            );
        }

        // 비밀번호 길이 검증
        if (password.length < 4) {
            return NextResponse.json(
                { success: false, message: '비밀번호는 최소 4글자 이상이어야 합니다.' },
                { status: 400 }
            );
        }

        // 아이디 중복 검사
        const existingUserById = await prisma.user.findUnique({
            where: { id: id.trim() },
        });
        if (existingUserById) {
            return NextResponse.json(
                { success: false, message: '이미 사용 중인 아이디입니다.' },
                { status: 400 }
            );
        }

        // 이메일 중복 검사
        const existingUserByEmail = await prisma.user.findUnique({
            where: { email: email.trim() },
        });
        if (existingUserByEmail) {
            return NextResponse.json(
                { success: false, message: '이미 등록된 이메일입니다.' },
                { status: 400 }
            );
        }

        // 비밀번호 해싱
        const hashedPassword = hashPassword(password);

        // 아바타 이미지 자동 생성 (DiceBear API)
        const profileImage = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name.trim())}`;

        // 유저 데이터 생성
        const newUser = await prisma.user.create({
            data: {
                id: id.trim(),
                email: email.trim(),
                name: name.trim(),
                password: hashedPassword,
                profileImage,
            },
        });

        // 비밀번호는 제외하고 유저 정보 반환
        const { password: _, ...userWithoutPassword } = newUser;

        return NextResponse.json(
            { success: true, user: userWithoutPassword, message: '회원가입이 완료되었습니다!' },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Signup API error:', error);
        return NextResponse.json(
            { success: false, message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
            { status: 500 }
        );
    }
}
