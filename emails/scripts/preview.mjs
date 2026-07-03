/**
 * Render marketing email previews to HTML and open the primary variant in the browser.
 */
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const emailsRoot = path.join(__dirname, "..");
const bundlePath = path.join(emailsRoot, "../functions/emails/renderSummerTour2026Launch.cjs");

// Always rebuild so source edits show up (do not reuse a stale .cjs).
execSync("npm run build", { cwd: emailsRoot, stdio: "inherit" });

const require = createRequire(import.meta.url);
// Drop require cache so a prior preview in the same process can't serve old HTML.
delete require.cache[require.resolve(bundlePath)];
const { renderSummerTour2026LaunchEmail } = require(bundlePath);

const outDir = path.join(emailsRoot, "preview");
mkdirSync(outDir, { recursive: true });

const variants = [
  {
    file: "summer-tour-2026-launch-sphere-alum.html",
    label: "Sphere alum (default cohort)",
    props: {
      greetingName: "Pat",
      audienceSegment: "sphere_alum",
      openerLabel: "Tuesday, July 7",
      inviteCode: "DEMO1",
    },
  },
  {
    file: "summer-tour-2026-launch-post-sphere.html",
    label: "Post-Sphere signup",
    props: {
      greetingName: "Pat",
      audienceSegment: "post_sphere_signup",
      openerLabel: "Tuesday, July 7",
    },
  },
];

for (const variant of variants) {
  const { html } = await renderSummerTour2026LaunchEmail(variant.props);
  const outFile = path.join(outDir, variant.file);
  writeFileSync(outFile, html, "utf8");
  console.log(`${variant.label}: ${outFile}`);
}

const primary = path.join(outDir, variants[0].file);
if (process.platform === "darwin") {
  execSync(`open "${primary}"`);
} else if (process.platform === "win32") {
  execSync(`start "" "${primary}"`, { shell: true });
} else {
  console.log(`Open in browser: file://${primary}`);
}
