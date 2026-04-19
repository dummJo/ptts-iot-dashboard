import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppWrapper from "@/components/AppWrapper";

const fontInter = Inter({ subsets: ["latin"], display: 'swap', variable: '--font-inter' });
const fontSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", display: 'swap', variable: '--font-serif' });
const fontMono = JetBrains_Mono({ subsets: ["latin"], display: 'swap', variable: '--font-mono' });

export const metadata: Metadata = {
  title: "PTTS SmartSensor Dashboard",
  description: "Real-time IoT monitoring — PT Prima Tekindo Tirta Sejahtera",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('ptts-theme');
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${fontInter.className} ${fontInter.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`} suppressHydrationWarning>
        <AppWrapper>
          {children}
        </AppWrapper>
      </body>
    </html>
  );
}
