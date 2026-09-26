import { DraftWorkspace } from '@/components/draft-workspace';
import { TallyleafMark, Wordmark, brand } from '@/components/brand';
import { Badge } from '@/components/ui/badge';
import { LockIcon } from '@/components/icons';

export default function Page() {
  return (
    <>
      <header className="border-b border-border/70 bg-background/70 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <TallyleafMark className="h-9 w-9 shrink-0" />
            <div className="min-w-0 leading-tight">
              <Wordmark className="text-xl" />
              <p className="hidden text-xs text-muted-foreground sm:block">
                {brand.tagline}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0 gap-1.5 py-1">
            <LockIcon className="h-3.5 w-3.5" />
            <span>
              Private<span className="hidden sm:inline"> · stays in this browser</span>
            </span>
          </Badge>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <section className="mb-8 max-w-2xl print:hidden">
          <p className="eyebrow text-brass-foreground">Project estimate worksheet</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Estimates, <span className="italic text-primary">neatly</span>{' '}
            tallied.
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Build a straightforward estimate, one line at a time — then save
            it, revisit it, and print a clean copy for your client.
          </p>
        </section>
        <DraftWorkspace />
      </main>
      <footer className="mx-auto max-w-7xl px-4 pb-10 text-xs text-muted-foreground sm:px-6 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-6">
          <span className="flex items-center gap-2">
            <TallyleafMark className="h-5 w-5" />
            {brand.name} — {brand.tagline}
          </span>
          <span>No accounts, no sync, no tracking. Your quotes stay on this device.</span>
        </div>
      </footer>
    </>
  );
}
