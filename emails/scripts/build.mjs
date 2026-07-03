/**
 * Bundle React Email templates to a CJS module for Cloud Functions.
 */
import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outFile = path.join(__dirname, "../../functions/emails/renderSummerTour2026Launch.cjs");

await esbuild.build({
  entryPoints: [path.join(__dirname, "../src/renderSummerTour2026Launch.jsx")],
  outfile: outFile,
  bundle: true,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  target: "node24",
  logLevel: "info",
});

console.log(`Built ${outFile}`);
