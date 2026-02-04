import "./globals.css";

export const metadata = {
  title: "Twitter Auto X",
  description: "Automation dashboard for X (Twitter)."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
