import { StudioApp } from "@/components/studio/StudioApp";
import { studioEnabled } from "@/lib/studio/server";

/** The builder. Runs only under `npm run dev` on your machine; the deployed site shows a note instead. */
export default function StudioPage() {
  if (!studioEnabled()) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="max-w-md text-center">
          <p className="label text-accent-text">Portfolio Studio</p>
          <h1 className="mt-3 font-display text-3xl text-ink">The Studio runs on your computer.</h1>
          <p className="mt-3 text-ink-2">
            Clone the repository, run <code className="rounded bg-sunken px-1.5 font-mono text-sm">npm run dev</code> and open{" "}
            <code className="rounded bg-sunken px-1.5 font-mono text-sm">localhost:3000/studio</code>. Nothing can be edited from the live site.
          </p>
        </div>
      </main>
    );
  }
  return <StudioApp />;
}
