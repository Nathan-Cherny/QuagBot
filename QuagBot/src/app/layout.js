import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "QuagBot",
  description: "QuagBot will help you understand the Revolutionary War through our RAG system. We love Quagsire!",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* On the chat page, pin the body to the viewport height so only the message list scrolls. */}
      <body className="flex min-h-full flex-col bg-bg font-sans text-text has-[[data-chat-window]]:h-full">{children}</body>
    </html>
  );
}
