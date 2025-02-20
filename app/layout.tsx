import './globals.css';
export const metadata = {
  title: 'Quote Builder',
  description: 'A simple project estimate worksheet.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><a href="#quote-workspace" className="sr-only focus:not-sr-only focus:block focus:p-4 print:hidden">Skip to quote workspace</a>{children}</body>
    </html>
  );
}
