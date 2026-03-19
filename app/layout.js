import "./globals.css";

export const metadata = {
  title: "OBS Lyrics Scene Generator",
  description: "Generate OBS Scene Collection JSON from lyrics text files."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-5xl p-6">{children}</div>
      </body>
    </html>
  );
}

