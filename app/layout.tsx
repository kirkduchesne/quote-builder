import './globals.css';
export const metadata = {
  title: 'Tallyleaf — Estimates, neatly tallied',
  description:
    'Tallyleaf is a private, local-first worksheet for building clear, printable service estimates.',
};
export const viewport = {
  themeColor: '#224f45',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#quote-workspace"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-soft print:hidden"
        >
          Skip to quote workspace
        </a>
        {children}
      </body>
    </html>
  );
}
