import type { Metadata, Viewport } from 'next';
import './globals.css';
import './lounge.css';
import './lounge-casino.css';
import './lounge-blackjack.css';
import './lounge-seotda.css';
import './lounge-club.css';
// Keep in sync with the Pages <head> in scripts/build-standalone.mjs.
export const metadata: Metadata = {
  title: '범타듀 밸리 · 일곱 친구의 마을',
  description:
    '일곱 친구가 사는 호현지방의 3D 마을, 범타듀 밸리. 골목을 산책하고 회관·카지노·분장실·내 방에서 함께 놀아요.',
  icons: { icon: '/favicon.svg', apple: '/icons/apple-touch-icon.png' },
  openGraph: {
    title: '범타듀 밸리',
    description:
      '일곱 친구가 사는 호현지방의 3D 마을, 범타듀 밸리. 골목을 산책하고 회관·카지노·분장실·내 방에서 함께 놀아요.',
    images: ['/og-image.webp'],
    locale: 'ko_KR',
    type: 'website',
  },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#5f8a55',
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
