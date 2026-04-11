import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PTTS SmartSensor Dashboard",
  description: "Real-time IoT monitoring — PT Prima Tekindo Tirta Sejahtera",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
