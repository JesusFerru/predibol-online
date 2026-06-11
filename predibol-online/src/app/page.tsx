import { Shell } from "@/components/layout/shell";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const fixturePath = "/assets/images/fixture-wc26.avif";
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
            Una plataforma para jugar con tus amigos y conocidos este Mundial FIFA 2026.
              Compite con amigos, predice los resultados, gana puntos y 
              <strong>sube al TOP para ganar premios!</strong>
          </p>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-crimson px-8 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-crimson/90"
          >
            ¡Empieza ya con tus predicciones!
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

      {/* Fixture Download Section */}
      <section className="bg-gray-50 border-t border-gray-100 py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex flex-col items-center gap-8 rounded-2xl bg-white p-6 shadow-sm border border-gray-100 sm:p-8">
            
            {/* Header: Title and Download button side-by-side on desktop */}
            <div className="flex flex-col items-center justify-between gap-4 w-full border-b border-gray-100 pb-6 sm:flex-row text-center sm:text-left">
              <div>
                <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  ¡Descarga tu Fixture físico del mundial!
                </h3>
                <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                  Guarda la imagen en máxima calidad (.AVIF) para imprimirla o compartirla.
                </p>
              </div>

              <a
                href={fixturePath}
                download="Fixture-Mundial-2026-Predibol.avif"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-crimson px-5 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-crimson/90 active:bg-wine focus:outline-none focus:ring-2 focus:ring-crimson/40 w-full sm:w-auto"
              >
                {/* SVG Download Icon */}
                <svg 
                fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="h-4 w-4"
                   xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 22.0002H16C18.8284 22.0002 20.2426 22.0002 21.1213 21.1215C22 20.2429 22 18.8286 22 16.0002V15.0002C22 12.1718 22 10.7576 21.1213 9.8789C20.3529 9.11051 19.175 9.01406 17 9.00195M7 9.00195C4.82497 9.01406 3.64706 9.11051 2.87868 9.87889C2 10.7576 2 12.1718 2 15.0002L2 16.0002C2 18.8286 2 20.2429 2.87868 21.1215C3.17848 21.4213 3.54062 21.6188 4 21.749" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M12 2L12 15M12 15L9 11.5M12 15L15 11.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Descargar
              </a>
            </div>

            {/* Image display */}
            <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 max-h-[450px] flex justify-center items-center shadow-inner">
              <Image
                src={"/assets/images/fixture-wc26.avif"}
                alt="Fixture Físico Copa Mundial 2026"
                width={1200}
                height={800}
                className="h-auto w-full object-contain"
                priority
              />
            </div>

          </div>
        </div>
      </section>
    </Shell>
  );
}
