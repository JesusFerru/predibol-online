import { Shell } from "@/components/layout/shell";
import fs from "fs";import path from "path";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

async function getRulesContent(): Promise<string> {
  const rulesPath = path.join(
    process.cwd(),
    "extra_info",
    "normativas.md",
  );
  try {
    return fs.readFileSync(rulesPath, "utf-8");
  } catch {
    return "# Game Rules\n\nRules content is being prepared.";
  }
}

export default async function RulesPage() {
  const content = await getRulesContent();

  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Usas 'prose' de Tailwind Typography, lo cual es excelente para dar estilo automático al HTML generado */}
        <article className="prose prose-gray max-w-none">
         <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </Shell>
  );
}
