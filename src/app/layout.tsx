import type { Metadata } from "next";
import "./globals.css";
import AppWrapper from "@/components/AppWrapper";

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
      <body suppressHydrationWarning>
        <AppWrapper>
          {children}
        </AppWrapper>
      </body>
    </html>
  );
}
