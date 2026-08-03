/**
 * Bundle React Email templates to CJS modules for Cloud Functions.
 */
import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const functionsEmails = path.join(__dirname, "../../functions/emails");

const entries = [
  {
    entry: path.join(__dirname, "../src/renderSummerTour2026Launch.jsx"),
    outfile: path.join(functionsEmails, "renderSummerTour2026Launch.cjs"),
  },
  {
    entry: path.join(__dirname, "../src/renderSummer2026AlmostEnd.jsx"),
    outfile: path.join(functionsEmails, "renderSummer2026AlmostEnd.cjs"),
  },
];

for (const { entry, outfile } of entries) {
  await esbuild.build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    target: "node24",
    logLevel: "info",
  });
  console.log(`Built ${outfile}`);
}
