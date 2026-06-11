import { Shell } from "@/components/layout/shell";
import { FaqAccordion } from "@/components/help/faq-accordion";
import { faqItems } from "@/lib/data/faq";

export default function HelpPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Page header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Ayuda y Preguntas Frecuentes
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
            Encontrá respuestas a las dudas más comunes sobre cómo usar la
            plataforma, cómo se calculan los puntos, y cómo funcionan las pozas
            diarias.
          </p>
        </div>

        {/* FAQ accordion */}
        <FaqAccordion items={faqItems} />

        {/* Bottom help note */}
        <p className="mt-6 text-center text-xs text-gray-400">
          ¿No encontraste lo que buscabas? Contactanos por el grupo de WhatsApp
          o consultá las{" "}
          <a
            href="/rules"
            className="text-crimson underline underline-offset-2 hover:text-crimson/80"
          >
            reglas oficiales
          </a>
          .
        </p>
      </div>
    </Shell>
  );
}
