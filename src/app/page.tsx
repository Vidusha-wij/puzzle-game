import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-10 p-8">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.4em] text-accent">Celogen</p>
        <h1 className="mt-2 text-5xl font-black tracking-tight sm:text-6xl">
          Jigsaw Booth
        </h1>
        <p className="mx-auto mt-3 max-w-md text-slate-500">
          Two screens, one puzzle. Open the display on the big screen and the
          controller on the laptop — they sync live.
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-5 sm:grid-cols-2">
        <RoleCard
          href="/display"
          emoji="🖥️"
          title="Big screen"
          desc="Open this on the tablet that drives the large vertical display. Read-only mirror + leaderboard."
          cta="Open display"
        />
        <RoleCard
          href="/play"
          emoji="🎮"
          title="Controller"
          desc="Open this on the laptop the player holds. Name, photo, and the puzzle they solve."
          cta="Open controller"
          accent
        />
      </div>

      <Link
        href="/admin"
        className="rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:ring-slate-300"
      >
        📋 Registrations &amp; CSV export
      </Link>

      <p className="max-w-md text-center text-xs text-slate-400">
        Puzzle images live in <code className="text-slate-600">public/game</code>.
      </p>
    </main>
  );
}

function RoleCard({
  href,
  emoji,
  title,
  desc,
  cta,
  accent,
}: {
  href: string;
  emoji: string;
  title: string;
  desc: string;
  cta: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md hover:ring-slate-300"
    >
      <div className="text-4xl">{emoji}</div>
      <h2 className="mt-3 text-2xl font-black">{title}</h2>
      <p className="mt-1 flex-1 text-sm text-slate-500">{desc}</p>
      <span
        className={`mt-4 inline-flex w-fit items-center gap-1 rounded-full px-4 py-2 text-sm font-bold transition ${
          accent
            ? "bg-accent text-white group-hover:brightness-110"
            : "bg-slate-100 text-slate-700 group-hover:bg-slate-200"
        }`}
      >
        {cta} →
      </span>
    </Link>
  );
}
