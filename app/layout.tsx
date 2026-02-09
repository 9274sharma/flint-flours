import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { ToastProvider } from "@/contexts/ToastContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Flint & Flours | Clean-Label Food",
  description:
    "India's most trusted clean-label food science company. Flint & Flours and Milora.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-stone-850 focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-stone-600"
        >
          Skip to main content
        </a>
        <CartProvider>
          <ToastProvider>
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
