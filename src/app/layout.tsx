import {
  materialSymbols,
  notoSansSC,
  notoSerifSC,
  robotoFlex,
  robotoMono,
} from "@/utils/fonts";

import "katex/dist/katex.min.css";
import "./globals.css";

import Header from "@/components/client/header";
import Footer from "@/components/footer";
import { ThemeProvider } from "next-themes";
import Cursor from "@/components/ux/cursor";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Apry的笔记本",
    default: "Arpy的博客 - 要保持分享哦",
  },
  description: "开发,折腾和生活",
  keywords: ["Next.js", "Material Design", "开发", "技术博客", "Blog"],
  authors: [{ name: "Iriseplosc" }],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://yourdomain.com",
    siteName: "Arpy的博客",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`relative bg-background ${notoSansSC.variable} ${robotoMono.variable} ${robotoFlex.variable} ${notoSerifSC.variable} ${materialSymbols.variable} antialiased`}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
        >
          <Header />
          {children}
          <Footer />
          <Cursor />
        </ThemeProvider>
      </body>
    </html>
  );
}
