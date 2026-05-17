import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fira_Code } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import connectDB from "@/lib/mongodb";
import Settings from "@/models/Settings";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const firaMono = Fira_Code({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Default settings when DB is unavailable
function getDefaultSettings() {
  return {
    siteName: "Craig Of The Creek",
    siteDescription: "Platform jual beli akun game terpercaya",
    siteSlogan: "Dapatkan Akun Game Impianmu!",
    logoUrl: "/logo.svg",
    ogImageUrl: "/og-image.png",
  };
}

// Fetch settings from DB for dynamic metadata
async function getSiteSettings() {
  try {
    const conn = await connectDB();
    if (!conn) return getDefaultSettings();
    const settings = await Settings.findOne().lean();
    if (settings) {
      return {
        siteName: settings.siteName || "Craig Of The Creek",
        siteDescription: settings.siteDescription || "Platform jual beli akun game terpercaya",
        siteSlogan: settings.siteSlogan || "Dapatkan Akun Game Impianmu!",
        logoUrl: settings.logoUrl || "/logo.svg",
        ogImageUrl: settings.ogImageUrl || "/og-image.png",
      };
    }
  } catch {
    // fallback to defaults
  }
  return getDefaultSettings();
}

// Dynamic metadata using generateMetadata
export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings();
  const title = `${site.siteName} - Jual Beli Akun Game Terpercaya`;
  const description = site.siteDescription;

  return {
    metadataBase: new URL("https://craigofthecreek.id"),
    title,
    description,
    keywords: [
      "jual akun game",
      "beli akun game",
      "akun Mobile Legends",
      "akun Free Fire",
      "akun Genshin Impact",
      "akun Valorant",
      "akun PUBG Mobile",
      "akun game murah",
      "QRIS",
      site.siteName,
      "akun game terpercaya",
    ],
    authors: [{ name: site.siteName }],
    icons: {
      icon: site.logoUrl,
    },
    openGraph: {
      title,
      description,
      url: "https://craigofthecreek.id",
      siteName: site.siteName,
      type: "website",
      images: [
        {
          url: site.ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${site.siteName} - Jual Beli Akun Game`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [site.ogImageUrl],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await getSiteSettings();

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ff2d2d" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: site.siteName,
              description: site.siteDescription,
              url: "https://craigofthecreek.id",
              logo: `https://craigofthecreek.id${site.logoUrl}`,
            }),
          }}
        />
      </head>
      <body
        className={`${jakartaSans.variable} ${firaMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <PWAInstallPrompt />
          {children}
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
