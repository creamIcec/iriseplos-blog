import {
  Roboto_Flex,
  Noto_Sans_SC,
  Roboto_Mono,
  Noto_Serif_SC,
} from "next/font/google";

const robotoFlex = Roboto_Flex({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-flex",
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-noto-sans-sc",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-mono",
});

const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700", "800"],
  variable: "--font-noto-serif-sc",
});

export { robotoFlex, notoSansSC, robotoMono, notoSerifSC };
