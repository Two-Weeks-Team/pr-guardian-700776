import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PR Guardian',
  description: 'AI-powered code reviews for GitHub pull requests.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="app-shell">{children}</main>
      </body>
    </html>
  );
}
