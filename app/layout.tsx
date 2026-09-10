import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'우리들의 여섯섬 · 오늘도, 함께',description:'여섯 친구와 만들어 가는 작은 섬의 하루. 산책, 채집, 낚시 그리고 우리만의 소풍.'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>) {return <html lang="ko"><body>{children}</body></html>}
