import { DraftWorkspace } from '@/components/draft-workspace';
export default function Page() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <header className="mb-8">
        <p>Project estimate worksheet</p>
        <h1 className="text-4xl font-semibold">Quote Builder</h1>
        <p>Build a straightforward estimate, one line at a time.</p>
      </header>
      <DraftWorkspace />
    </main>
  );
}
