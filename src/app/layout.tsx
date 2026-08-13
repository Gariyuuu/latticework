import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/shell/theme-provider";
import { AppearanceProvider, AppearanceScript } from "@/components/shell/appearance-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
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
  title: "Latticework — Master the skills engineers actually use",
  description:
    "Learn programming, AI, data, computer science, and quantitative engineering through interactive lessons and real code.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AppearanceScript />
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "oklch(0.66 0.19 264)",
              colorBackground: "oklch(0.175 0.014 264)",
              colorForeground: "oklch(0.96 0.005 264)",
              colorMutedForeground: "oklch(0.66 0.02 264)",
              colorInput: "oklch(0.135 0.012 264)",
              colorInputForeground: "oklch(0.96 0.005 264)",
              borderRadius: "0.75rem",
            },
          }}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <AppearanceProvider>
              <TooltipProvider delayDuration={200}>
                {children}
                <Toaster />
              </TooltipProvider>
            </AppearanceProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
