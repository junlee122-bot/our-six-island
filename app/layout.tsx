import type { Metadata } from 'next';
import './globals.css';
import './theater.css';
export const metadata: Metadata = {title:'호현지방 · 우당탕 극장',description:'일곱 친구의 분장실과 작은 무대. 옷을 갈아입고, 배역을 맡고, 우리만의 우당탕 에피소드를 만드세요.'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) {return <html lang="ko"><body>{children}</body></html>}
