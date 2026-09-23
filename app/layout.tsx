import type { Metadata } from 'next';
import './globals.css';
import './lounge.css';
import './lounge-casino.css';
import './lounge-blackjack.css';
import './lounge-seotda.css';
import './lounge-club.css';
export const metadata: Metadata = {
  title: '범타듀 밸리 · 게임 라운지',
  description:
    '일곱 친구가 사는 마을. 캐릭터와 내 방을 꾸미고 체스·고스톱·섯다·홀덤·블랙잭을 함께 즐기는 범타듀 밸리.',
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
