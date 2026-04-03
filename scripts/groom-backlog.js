import fs from 'fs';
import readline from 'readline/promises';

// --- Configuration ---
const REPO_OWNER = 'pat792';
const REPO_NAME = 'set-picks';
const GITHUB_TOKEN = process.env.GITHUB_PAT;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GITHUB_API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function runGroomer() {
  console.log('🧹 Starting Backlog Groomer...\n');

  if (!GITHUB_TOKEN || !GEMINI_API_KEY) {
    console.error('❌ Error: Missing GITHUB_PAT or GEMINI_API_KEY in your .env file.');
    process.exit(1);
  }

  // 1. Get today's date and FSD rules
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  let cursorRules = '';
  try {
    cursorRules = fs.readFileSync('.cursorrules', 'utf-8');
    console.log('✅ Loaded .cursorrules');
  } catch (err) {
    console.warn('⚠️ Could not find .cursorrules, proceeding without it.');
  }

  // 2. Fetch open issues
  console.log('📥 Fetching open issues from GitHub...');
  const issuesRes = await fetch(`${GITHUB_API_BASE}/issues?state=open&per_page=50`, {
    headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  
  const issues = await issuesRes.json();
  const pureIssues = issues.filter(issue => !issue.pull_request);
  console.log(`Found ${pureIssues.length} open issues to review.\n`);

  // 3. Process each issue
  for (const issue of pureIssues) {
    console.log(`\n--------------------------------------------------`);
    console.log(`🔎 Reviewing Issue #${issue.number}: ${issue.title}`);
    console.log(`--------------------------------------------------`);

    if (issue.labels.some(label => label.name === 'AI-PRD')) {
      console.log(`⏭️  Skipping: Already has 'AI-PRD' label.`);
      continue;
    }

    // 4. Prompt Gemini with dynamic date
    const prompt = `You are an expert Technical Product Manager. Convert the following old backlog issue into a modern, comprehensive Product Requirements Document (PRD) formatted in GitHub-Flavored Markdown. 
    
    Start the PRD with a metadata header that includes: "**Last Updated:** ${currentDate}".

    CRITICAL ARCHITECTURE CONTEXT:
    ${cursorRules}
    
    REQUIREMENTS FOR THE PRD:
    1. The Goal (User Story)
    2. Acceptance Criteria
    3. Technical Implementation (Adhere STRICTLY to the FSD architecture above)
    4. Proposed File Changes (Guess the likely files to touch based on FSD)
    5. Agent Guardrails
    
    Issue Title: ${issue.title}
    Original Issue Body: ${issue.body || 'No description provided.'}`;

    console.log('🤖 Asking Gemini to rewrite into an FSD-compliant PRD...');
    const aiRes = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const aiData = await aiRes.json();
    const newBody = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!newBody) {
      console.log('❌ Gemini failed to generate a response. Skipping.');
      continue;
    }

    // 5. Preview & Approve
    console.log('\n✨ --- PROPOSED PRD --- ✨\n\n' + newBody + '\n\n✨ -------------------- ✨\n');
    const answer = await rl.question(`\n❓ Update Issue #${issue.number} with this PRD? (y/n/q to quit): `);

    if (answer.toLowerCase() === 'q') {
      console.log('🛑 Aborting script.');
      break;
    }

    if (answer.toLowerCase() === 'y') {
      console.log(`\n⬆️  Updating Issue #${issue.number}...`);
      await fetch(`${GITHUB_API_BASE}/issues/${issue.number}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          body: newBody + "\n\n---\n*Backlog groomed autonomously by Gemini AI*",
          labels: [...issue.labels.map(l => l.name), 'AI-PRD']
        })
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