import type { Metadata } from 'next';
import './globals.css';
import { CostProvider } from '../context/CostContext';

export const metadata: Metadata = {
  title: 'Commerce Prompt Analyzer',
  description: 'Analyze and optimize your e-commerce AEO strategy.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50">
        <CostProvider>
          {children}
        </CostProvider>
      </body>
    </html>
  );
}
