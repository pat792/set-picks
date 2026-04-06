import fs from 'fs';
import path from 'path';
import readline from 'readline/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, '..');
const AUTOMATION_CONTEXT_PATH = path.join(
  REPO_ROOT,
  'docs/GITHUB_AUTOMATION_CONTEXT.md'
);

// --- Configuration ---
const REPO_SPEC = process.env.GITHUB_REPOSITORY || 'pat792/set-picks';
const [REPO_OWNER, REPO_NAME] = REPO_SPEC.includes('/')
  ? REPO_SPEC.split('/', 2)
  : ['pat792', 'set-picks'];

const GITHUB_TOKEN = process.env.GITHUB_PAT;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GITHUB_API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/** Skip grooming (align with .github/workflows/gemini-pm.yml + docs/GITHUB_AUTOMATION_CONTEXT.md). */
const GROOM_BLOCK_LABELS = new Set([
  'AI-PRD',
  'skip-groom',
  'skip-prd',
  'cursor-authored',
]);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function loadAutomationContext() {
  try {
    const text = fs.readFileSync(AUTOMATION_CONTEXT_PATH, 'utf-8');
    console.log('✅ Loaded docs/GITHUB_AUTOMATION_CONTEXT.md');
    return text;
  } catch (err) {
    console.warn(
      '⚠️ Could not read docs/GITHUB_AUTOMATION_CONTEXT.md, using minimal fallback.'
    );
    return (
      'Use reduced FSD: src/pages/, src/features/<domain>/{api,model,ui}/, src/shared/. ' +
      'Firebase only. Cloud Functions in functions/. No generic src/components for new features.'
    );
  }
}

function shouldSkipIssue(issue) {
  const labels = issue.labels?.map((l) => l.name) || [];
  for (const name of labels) {
    if (GROOM_BLOCK_LABELS.has(name)) {
      return { skip: true, reason: `label "${name}"` };
    }
  }
  const body = issue.body || '';
  if (body.trimStart().startsWith('[SKIP-PRD]')) {
    return {
      skip: true,
      reason: 'body starts with [SKIP-PRD] (agent-authored; do not overwrite)',
    };
  }
  return { skip: false };
}

async function runGroomer() {
  console.log('🧹 Starting Backlog Groomer...\n');

  if (!GITHUB_TOKEN || !GEMINI_API_KEY) {
    console.error('❌ Error: Missing GITHUB_PAT or GEMINI_API_KEY in your .env file.');
    process.exit(1);
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const automationContext = loadAutomationContext();

  console.log('📥 Fetching open issues from GitHub...');
  const issuesRes = await fetch(
    `${GITHUB_API_BASE}/issues?state=open&per_page=50`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  const issues = await issuesRes.json();
  const pureIssues = issues.filter((issue) => !issue.pull_request);
  console.log(`Found ${pureIssues.length} open issues to review.\n`);

  for (const issue of pureIssues) {
    console.log(`\n--------------------------------------------------`);
    console.log(`🔎 Reviewing Issue #${issue.number}: ${issue.title}`);
    console.log(`--------------------------------------------------`);

    const { skip, reason } = shouldSkipIssue(issue);
    if (skip) {
      console.log(`⏭️  Skipping: ${reason}.`);
      continue;
    }

    const prompt = `You are an expert Technical Product Manager. Convert the following old backlog issue into a modern, comprehensive Product Requirements Document (PRD) formatted in GitHub-Flavored Markdown.

Start the PRD with a metadata header that includes: "**Last Updated:** ${currentDate}".

REPOSITORY ARCHITECTURE (follow exactly for paths and layers):
${automationContext}

REQUIREMENTS FOR THE PRD:
1. The Goal (User Story)
2. Acceptance Criteria
3. Technical Implementation (adhere STRICTLY to the architecture above)
4. Proposed File Changes (real paths under src/pages, src/features/<domain>/{api,model,ui}, src/shared, src/app, functions/, firestore.rules — no generic src/components for new feature code)
5. Agent Guardrails

Issue Title: ${issue.title}
Original Issue Body: ${issue.body || 'No description provided.'}`;

    console.log('🤖 Asking Gemini to rewrite into an FSD-compliant PRD...');
    const aiRes = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    const aiData = await aiRes.json();
    const newBody = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!newBody) {
      console.log('❌ Gemini failed to generate a response. Skipping.');
      if (aiData.error) {
        console.error('API error:', JSON.stringify(aiData.error, null, 2));
      }
      continue;
    }

    console.log('\n✨ --- PROPOSED PRD --- ✨\n\n' + newBody + '\n\n✨ -------------------- ✨\n');
    const answer = await rl.question(
      `\n❓ Update Issue #${issue.number} with this PRD? (y/n/q to quit): `
    );

    if (answer.toLowerCase() === 'q') {
      console.log('🛑 Aborting script.');
      break;
    }

    if (answer.toLowerCase() === 'y') {
      console.log(`\n⬆️  Updating Issue #${issue.number}...`);
      await fetch(`${GITHUB_API_BASE}/issues/${issue.number}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body:
            newBody + '\n\n---\n*Backlog groomed autonomously by Gemini AI*',
          labels: [...issue.labels.map((l) => l.name), 'AI-PRD'],
        }),
      });
      console.log(`✅ Issue #${issue.number} updated successfully!`);
    } else {
      console.log(`⏭️  Skipped Issue #${issue.number}.`);
    }
  }

  console.log('\n🎉 Backlog Grooming Complete!');
  rl.close();
}

runGroomer();
