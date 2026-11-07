import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans, EB_Garamond } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const ebGaramondHeading = EB_Garamond({subsets:['latin'],variable:'--font-heading'});

const notoSans = Noto_Sans({subsets:['latin'],variable:'--font-sans'});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Flowdesk",
    template: "%s · Flowdesk",
  },
  description: "Flowdesk: one inbox for every website inquiry.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistMono.variable, "font-sans", notoSans.variable, ebGaramondHeading.variable)}
    >
      {/* Browser extensions often add attributes to <body> before React loads
          (e.g. location="localhost"), which triggers a harmless hydration warning. */}
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
