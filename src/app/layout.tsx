import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI Content Factory',
  description: 'Create short-form videos from a script with AI.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-100`}>
        {children}
        <footer className="border-t border-zinc-800 bg-zinc-950">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            <div className="flex flex-col gap-2 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
              <span>© 프라이머리시스템</span>
              <a href="mailto:yunjun2006best@gmail.com" className="hover:text-zinc-400">yunjun2006best@gmail.com</a>
              <span className="flex gap-4">
                <a href="/privacy" className="hover:text-zinc-400">Privacy Policy</a>
                <a href="/terms" className="hover:text-zinc-400">Terms of Service</a>
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
