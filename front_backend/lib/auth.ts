import crypto from 'crypto';

/**
 * 비밀번호를 PBKDF2 방식으로 안전하게 솔팅하여 단방향 해싱합니다.
 * database/init.sql의 test_user_01 시드와 연동을 위해 고정된 salt 값을 사용합니다.
 */
export function hashPassword(password: string): string {
    const salt = 'traivl_salt_key_12984';
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash;
}
