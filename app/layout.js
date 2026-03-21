import "./globals.css";

export const metadata = {
  title: "OBS Scenes Generator",
  description: "Convert worship lyrics into OBS scene collections.",
};

export default function RootLayout({ children }) {
  return (
    <html lang='en' className='scroll-smooth'>
      <body className='bg-background text-foreground antialiased'>{children}</body>
    </html>
  );
}
