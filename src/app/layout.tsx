import Sidebar from '@/components/common/Sidebar';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { sincerity } from '@/fonts';
import { AuthContext } from '@/context';
import ReactQueryContext from '@/context/ReactQueryContext';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='ko' className={sincerity.className}>
      <ReactQueryContext>
        <AuthContext>
          <body className='flex flex-col-reverse bg-gray-500 sm:flex-row'>
            <Sidebar />
            <main className='w-full grow max-w-screen-xl mx-auto '>
              {children}
            </main>
          </body>
        </AuthContext>
        <ReactQueryDevtools />
      </ReactQueryContext>
    </html>
  );
}
