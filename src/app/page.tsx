import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-10 p-8">
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.4em] text-accent">Celogen</p>
        <h1 className="mt-2 text-5xl font-black tracking-tight sm:text-6xl">
          Jigsaw Booth
        </h1>
        <p className="mx-auto mt-3 max-w-md text-white/60">
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

      <p className="max-w-md text-center text-xs text-white/40">
        Tip: put your attract artwork at <code className="text-white/60">public/hero.jpg</code>.
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
      className="group flex flex-col rounded-3xl bg-white/[0.04] p-6 ring-1 ring-white/10 transition hover:bg-white/[0.07] hover:ring-white/25"
    >
      <div className="text-4xl">{emoji}</div>
      <h2 className="mt-3 text-2xl font-black">{title}</h2>
      <p className="mt-1 flex-1 text-sm text-white/60">{desc}</p>
      <span
        className={`mt-4 inline-flex w-fit items-center gap-1 rounded-full px-4 py-2 text-sm font-bold transition ${
          accent
            ? "bg-accent text-black group-hover:bg-emerald-300"
            : "bg-white/10 text-white group-hover:bg-white/20"
        }`}
      >
        {cta} →
      </span>
    </Link>
  );
}
