import './globals.css';
export const metadata = { title: 'Quote Builder', description: 'A simple project estimate worksheet.' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
