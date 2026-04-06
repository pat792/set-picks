# Google Analytics MCP (Cursor)

This connects Cursor to [Google’s official Analytics MCP](https://github.com/googleanalytics/google-analytics-mcp) (`analytics-mcp` on PyPI) so agents can call the Analytics **Admin** and **Data** APIs (read-only).

## What was installed on this machine

- **pipx** (via Homebrew): `/opt/homebrew/bin/pipx`
- **analytics-mcp** (via pipx): console command at `~/.local/bin/analytics-mcp`

Keep `~/.local/bin` on your PATH (run `pipx ensurepath` if needed), or rely on the **absolute path** in `~/.cursor/mcp.json`.

## 1. Google Cloud: enable APIs

In the [Google Cloud project](https://console.cloud.google.com/) that should own API access (often the same project linked to GA4):

1. Enable [Google Analytics Admin API](https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com)
2. Enable [Google Analytics Data API](https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com)

## 2. Credentials (pick one)

Credentials must allow scope:

`https://www.googleapis.com/auth/analytics.readonly`

### Option A — User login (good for personal / quick setup)

1. Install [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) if needed.
2. Create an **OAuth client** (Desktop or Web) in Google Cloud and download the client JSON ([Manage OAuth clients](https://support.google.com/cloud/answer/15549257)).
3. Run (paths from [Google’s README](https://github.com/googleanalytics/google-analytics-mcp)):

```bash
gcloud auth application-default login \
  --scopes https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/cloud-platform \
  --client-id-file=YOUR_CLIENT_JSON_FILE
```

4. Note the printed **“Credentials saved to file: …”** path. That file is usually:

`~/.config/gcloud/application_default_credentials.json`

5. If you use a **non-default** ADC path, set `GOOGLE_APPLICATION_CREDENTIALS` in `~/.cursor/mcp.json` under the `google-analytics-mcp` server `env` to that full path.

### Option B — Service account (good for automation)

1. Create a service account in the same GCP project; create a JSON key.
2. In **GA4**: Admin → Property → Property access management → grant the service account email at least **Viewer** (read-only reporting).
3. Set in `~/.cursor/mcp.json` (see below):

- `GOOGLE_APPLICATION_CREDENTIALS` = full path to the JSON key file  
- `GOOGLE_CLOUD_PROJECT` = your GCP **project ID**

## 3. Cursor MCP config

Edit **`~/.cursor/mcp.json`** (user-level). A `google-analytics-mcp` entry should look like this:

```json
"google-analytics-mcp": {
  "command": "/Users/pat/.local/bin/analytics-mcp",
  "args": [],
  "env": {
    "GOOGLE_CLOUD_PROJECT": "your-gcp-project-id"
  }
}
```

- Replace `your-gcp-project-id` with your real [project ID](https://support.google.com/googleapi/answer/7014113).
- If you use **Option B**, add:

`"GOOGLE_APPLICATION_CREDENTIALS": "/absolute/path/to/service-account.json"`

Restart **Cursor** after saving.

## 4. Verify

In Cursor, open MCP tools / ask the agent to use the Google Analytics MCP: e.g. list account summaries or run a small `run_report` for the last 7 days.

Official walkthrough: [YouTube — Google Analytics MCP setup](https://www.youtube.com/watch?v=nS8HLdwmVlY).

## Security

- Do **not** commit service account JSON or OAuth secrets into the repo.
- Prefer restricting the service account to the GA4 properties you need.
