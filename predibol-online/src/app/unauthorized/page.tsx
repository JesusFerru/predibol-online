import Image from "next/image";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
      <Image
        src="/assets/images/background-wc26.jpg"
        alt="World Cup 2026"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative z-10 flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-black/40 px-10 py-12 text-center shadow-2xl backdrop-blur-md">
        <Image
          src="/assets/images/logo/predibol-logo-blanco.png"
          alt="Predibol"
          width={150}
          height={50}
          className="h-auto w-36"
        />

        <h1 className="text-2xl font-semibold text-white">
          Access Restricted
        </h1>

        <p className="max-w-sm text-white/70">
          You are not authorized to submit predictions. Please contact the
          administrator.
        </p>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-gray-800 shadow-md transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
