export const metadata = {
    title: 'Traivl',
    description: 'Traivl 풀스택 애플리케이션',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
            <body>{children}</body>
        </html>
    );
}
