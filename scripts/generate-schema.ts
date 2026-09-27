/**
 * Writes content/portfolio.schema.json from the Zod schema, so editors (VS Code etc.) give
 * autocomplete and validation when you hand-edit content/portfolio.json.
 *   npm run schema
 */
import { writeFileSync } from "node:fs";
import { z } from "zod";
import { PortfolioSchema } from "../src/lib/content/schema";

const schema = z.toJSONSchema(PortfolioSchema, { io: "input", unrepresentable: "any" });
writeFileSync(
  new URL("../content/portfolio.schema.json", import.meta.url),
  `${JSON.stringify({ ...schema, title: "Portfolio content", description: "Edited by Portfolio Studio (npm run dev → /studio)." }, null, 2)}\n`,
);
console.log("✓ content/portfolio.schema.json");
