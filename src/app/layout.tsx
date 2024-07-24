import Sidebar from '@/components/common/Sidebar';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { sincerity } from '@/fonts';
import { AuthContext } from '@/context';
import ReactQueryContext from '@/context/ReactQueryContext';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import TimeContextProvider from '@/context/TimeContext';
import CheckUnloadHOC from '@/hoc/CheckUnloadHOC';

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
          <TimeContextProvider>
            <CheckUnloadHOC>
              <body className='flex flex-col-reverse bg-h_black sm:flex-row text-white gap-4'>
                <Sidebar />
                <main className='overflow-y-auto flex-1 '>
                  <div className='w-full grow max-w-screen-xl mx-auto px-4 sm:px-0'>
                    {children}
                  </div>
                </main>
                <ReactQueryDevtools />
              </body>
            </CheckUnloadHOC>
          </TimeContextProvider>
        </AuthContext>
      </ReactQueryContext>
    </html>
  );
}
