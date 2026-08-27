import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { AudioProvider } from "@/lib/AudioContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata = {
  title: "The Global Chronicle | Real-Time News & Intelligence",
  description: "Real-time global news journal covering world headlines, technology, business markets, science, and verified international reporting.",
  openGraph: {
    title: "The Global Chronicle | Real-Time News & Intelligence",
    description: "Real-time global news journal covering world headlines, technology, business markets, and verified international reporting.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#07090e] text-[#f8fafc] selection:bg-[#38bdf8]/20 selection:text-[#38bdf8]">
        <AudioProvider>{children}</AudioProvider>
      </body>
    </html>
  );
}
