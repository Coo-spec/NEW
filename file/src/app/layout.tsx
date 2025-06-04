import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import { SessionProvider } from 'next-auth/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'MegaClone',
  description: 'Transfer large files easily',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <Navbar />
          <main className="max-w-4xl mx-auto px-4">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
