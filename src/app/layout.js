import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "../components/Navbar";
import config from "@/lib/config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata = {
  title: "CardAI Creator - Premium AI Digital Business Cards",
  description: "Create stunning, interactive digital business cards using AI templates, an OpenAI-powered chatbot, vCard export, and built-in analytics.",
  keywords: ["digital business card", "AI business card", "QR code card", "vCard", "OpenAI", "networking"],
};

export default function RootLayout({ children }) {
  const theme = config?.app?.theme || "light";

  return (
    <html lang="en" className="h-dvh w-full" data-theme={theme}>
      <body className={`${inter.variable} ${outfit.variable} h-full w-full flex flex-col antialiased bg-white text-gray-900 font-sans`}>
        <Providers>
          <Navbar />
          <div className="flex-1 flex flex-col overflow-hidden">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
