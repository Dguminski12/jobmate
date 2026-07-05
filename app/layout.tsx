import type { Metadata } from "next";
import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import PwaRegister from "@/components/pwa/pwa-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobMate | AI Job & Interview Coach",
  description:
    "Upload your CV and job descriptions to generate tailored cover letters, interview questions, and STAR answers.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#01030a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var s=localStorage.getItem('jobmate-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=(s==='dark'||s==='light')?s:(d?'dark':'light');document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
