import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'FinanceFlow | Funding operations', description: 'Interactive demo of a marketing funding approval workflow.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
