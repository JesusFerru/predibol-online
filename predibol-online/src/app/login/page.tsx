import { LoginButton } from "@/components/auth/login-button";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/portal");
  }

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

      <div className="relative z-10 flex flex-col items-center gap-8 rounded-2xl border border-white/10 bg-black/40 px-10 py-12 shadow-2xl backdrop-blur-md">
        <Image
          src="/assets/images/logo/predibol-logotipo-inverso.png"
          alt="Predibol"
          width={180}
          height={60}
          className="h-auto w-44"
        />
        <h1 className="text-center text-2xl font-semibold text-white">
          Welcome to Predibol Online
        </h1>
        <p className="max-w-xs text-center text-sm leading-relaxed text-white/70">
          Sign in to submit your World Cup predictions.
        </p>
        <LoginButton />
      </div>
    </div>
  );
}
