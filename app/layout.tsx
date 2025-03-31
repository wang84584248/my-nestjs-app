import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DeepSeek 聊天界面",
  description: "使用Next.js和Shadcn/UI构建的DeepSeek风格聊天界面",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark tongyi-design-pc">
      <body className={`${inter.className} bg-zinc-900 text-white`}>{children}</body>
    </html>
  );
}
