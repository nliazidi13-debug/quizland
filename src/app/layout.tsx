import type { Metadata, Viewport } from "next";
import { Baloo_2, Poppins, Geist_Mono } from "next/font/google";
import { IntroSplash } from "@/components/quizland/intro-splash";
import { PwaRegister } from "@/components/quizland/pwa-register";
import { RequireProfile } from "@/components/quizland/require-profile";
import "./globals.css";

const baloo = Baloo_2({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const poppins = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quizland — Deviens le champion du quiz",
  description:
    "Quizland : quiz de culture générale en 14 domaines et 5 niveaux de difficulté. Affronte tes amis, grimpe au classement et débloque des trophées.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Quizland",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icon.png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1A0E33",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${baloo.variable} ${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <PwaRegister />
        <IntroSplash>
          <RequireProfile>{children}</RequireProfile>
        </IntroSplash>
      </body>
    </html>
  );
}
