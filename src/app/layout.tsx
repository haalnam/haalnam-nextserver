import Sidebar from '@/components/common/Sidebar';
import './globals.css';
import type { Metadata } from 'next';
//import { Inter } from 'next/font/google';
import { sincerity } from '@/fonts';
import { AuthContext } from '@/context';
import ReactQueryContext from '@/context/ReactQueryContext';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import TimeContextProvider from '@/context/TimeContext';
import CheckUnloadHOC from '@/hoc/CheckUnloadHOC';
import HeightAdjustHOC from '@/hoc/HeightAdjustHOC';

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
		<html lang="ko" className={sincerity.className}>
			<ReactQueryContext>
				<AuthContext>
					<TimeContextProvider>
						<CheckUnloadHOC>
							<body className="flex flex-col-reverse gap-4 bg-h_black text-white md:flex-row">
								<Sidebar />
								<main className="flex-1 overflow-y-auto">
									<div className="mx-auto h-full min-h-full w-full max-w-screen-xl px-4 sm:px-0">
										{children}
									</div>
								</main>
							</body>
							<ReactQueryDevtools />
						</CheckUnloadHOC>
					</TimeContextProvider>
				</AuthContext>
			</ReactQueryContext>
		</html>
	);
}
