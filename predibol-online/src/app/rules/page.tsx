import { Shell } from "@/components/layout/shell";
import fs from "fs";
import path from "path";

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
        <article className="prose prose-gray max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-gray-800">
            {content}
          </pre>
        </article>
      </div>
    </Shell>
  );
}
