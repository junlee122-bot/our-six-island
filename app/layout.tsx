import type { Metadata } from 'next';
import './globals.css';
import './lounge.css';
export const metadata: Metadata = {
  title: '호현지방 · 게임 라운지',
  description:
    '일곱 친구의 작은 아지트. 2D 캐릭터를 꾸미고, 함께 모여 체스와 고스톱을 즐겨 보세요.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
