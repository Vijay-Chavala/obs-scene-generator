import "./globals.css";

export const metadata = {
  title: "OBS Scenes Generator",
  description: "Convert worship lyrics into OBS scene collections.",
  icons: {
    icon: "/church-lyrics-generator.png",
    apple: "/church-lyrics-generator.png",
    shortcut: "/church-lyrics-generator.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang='en' className='scroll-smooth dark' suppressHydrationWarning>
      <body className='bg-background text-foreground antialiased'>{children}</body>
    </html>
  );
}
