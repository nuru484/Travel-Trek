import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { StoreProvider } from "./StoreProvider";
import { ThemeProvider } from "@/components/theme-provider";

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://traveltrek.dagraroyal.org";

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Travel Trek",
    default: "Travel Trek — Explore. Experience. Enjoy.",
  },
  description:
    "Travel Trek is a comprehensive travel and tour management system designed to simplify booking, planning, and managing tours and trips. Explore destinations, manage itineraries, and enjoy seamless travel experiences with Travel Trek.",
  keywords: [
    "Travel Trek",
    "travel management system",
    "tour booking",
    "trip planner",
    "travel agency software",
    "tour operator platform",
    "travel app",
    "tour packages",
    "holiday planner",
    "destination management",
    "travel portal",
    "online booking",
  ],
  authors: [{ name: "Nurudeen Abdul-Majeed" }],
  creator: "Nurudeen Abdul-Majeed",
  publisher: "Nurudeen Abdul-Majeed",
  metadataBase: new URL(baseUrl),
  openGraph: {
    title: "Travel Trek — Explore. Experience. Enjoy.",
    description:
      "Manage and book tours effortlessly with Travel Trek, your all-in-one travel and tour management platform for travelers, guides, and agencies.",
    url: baseUrl,
    siteName: "Travel Trek",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Travel Trek – Explore the world with ease",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Travel Trek — Explore. Experience. Enjoy.",
    description:
      "Travel Trek simplifies travel and tour management — from booking destinations to organizing trips, all in one modern platform.",
    site: "@TravelTrek",
    images: ["/open-graph-images/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${cormorantGaramond.variable} ${montserrat.variable} antialiased`}
      >
        <StoreProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster
              position="bottom-right"
              reverseOrder={false}
              toastOptions={{
                className: "",
                duration: 5000,
              }}
            />
            <main>{children}</main>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
