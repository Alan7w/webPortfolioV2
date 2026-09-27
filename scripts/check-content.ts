/**
 * Validates content/portfolio.json and prints the Coach report — handy before publishing or in CI.
 *   npm run check          (fails on errors)
 *   npm run check -- --all (also lists suggestions)
 */
import { readFileSync } from "node:fs";
import { runCoach } from "../src/lib/content/coach";
import { PortfolioSchema } from "../src/lib/content/schema";

const raw = JSON.parse(readFileSync(new URL("../content/portfolio.json", import.meta.url), "utf8"));
const parsed = PortfolioSchema.safeParse(raw);
if (!parsed.success) {
  console.error("✗ content/portfolio.json does not match the schema:");
  for (const issue of parsed.error.issues.slice(0, 20)) console.error(`  • ${issue.path.join(".")}: ${issue.message}`);
  process.exit(1);
}

const issues = runCoach(parsed.data);
const showAll = process.argv.includes("--all");
const icon = { error: "✗", warn: "!", info: "·" } as const;
for (const issue of issues) {
  if (issue.severity === "info" && !showAll) continue;
  console.log(`${icon[issue.severity]} [${issue.category}] ${issue.title}${issue.detail ? `\n    ${issue.detail}` : ""}`);
}
const count = (s: string) => issues.filter((i) => i.severity === s).length;
console.log(`\n${count("error")} errors · ${count("warn")} warnings · ${count("info")} suggestions${showAll ? "" : " (run with --all to list)"}`);
process.exit(count("error") ? 1 : 0);
