import { Shell } from "@/components/layout/shell";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <Shell>
      {/* Hero section */}
      <section className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center overflow-hidden">
        <Image
          src="/assets/images/background-wc26.jpg"
          alt="World Cup 2026"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />

        <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center">
          <Image
            src="/assets/images/tournaments_fifa-world-cup-2026--white_256x256.football-logos.cc.png"
            alt="FIFA World Cup 2026"
            width={160}
            height={160}
            className="h-auto w-32 sm:w-40"
          />

          <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Predibol Online
          </h1>

          <p className="max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
            The private prediction platform for the FIFA World Cup 2026.
            Compete with friends, predict every match, and climb the
            leaderboard.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-crimson px-8 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-crimson/90"
          >
            Sign in to submit your World Cup predictions
          </Link>
        </div>
      </section>

      {/* General info section */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            FIFA World Cup 2026
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
            The 23rd edition of the FIFA World Cup will be hosted by Canada,
            Mexico, and the United States. For the first time in history, 48
            nations will compete in the tournament, making it the largest World
            Cup ever.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
            The tournament kicks off on June 11, 2026, and culminates with the
            final on July 19, 2026. Matches will be played across 16 host
            cities in all three countries.
          </p>
        </div>
      </section>
    </Shell>
  );
}
