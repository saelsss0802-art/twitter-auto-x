import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Twitter Auto X',
  description: 'Setup for Twitter Auto X'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
