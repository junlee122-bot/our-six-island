import type { Metadata } from 'next';
import './globals.css';
import './lounge.css';
import './lounge-casino.css';
export const metadata: Metadata = {
  title: '호현지방 · 게임 라운지',
  description:
    '일곱 친구의 작은 아지트. 2D 캐릭터를 꾸미고 체스·고스톱·홀덤을 함께 즐기는 호현지방.',
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
