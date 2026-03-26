import { readFile } from "node:fs/promises";

const HOME = (process.env.USERPROFILE || process.env.HOME || ".").replace(
  /\\/g,
  "/",
);
const CLAUDE_CREDENTIALS_FILE = `${HOME}/.claude/.credentials.json`;
const TOKEN_URL = "https://platform.claude.com/v1/oauth/token";
const REDIRECT_URI = "https://platform.claude.com/oauth/code/callback";
const CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
async function loadClaudeCredentials() {
  let raw;
  try {
    raw = await readFile(CLAUDE_CREDENTIALS_FILE, "utf8");
  } catch {
    const msg =
      `[sol-anthropic-bypass] Claude credentials not found at: ${CLAUDE_CREDENTIALS_FILE}\n` +
      `  Make sure Claude Code is installed and logged in.\n` +
      `  Run: claude login\n` +
      `  Then restart opencode.`;
    console.error(msg);
    throw new Error(msg);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const msg =
      `[sol-anthropic-bypass] Failed to parse: ${CLAUDE_CREDENTIALS_FILE}\n` +
      `  The file may be corrupted. Try logging in again with: claude login`;
    console.error(msg);
    throw new Error(msg);
  }

  const oauth = parsed?.claudeAiOauth;
  const expires = Number(oauth?.expiresAt);
  if (
    !oauth?.accessToken ||
    !oauth?.refreshToken ||
    !Number.isFinite(expires)
  ) {
    const msg =
      `[sol-anthropic-bypass] Claude credentials exist but OAuth tokens are missing.\n` +
      `  Try logging in again with: claude login\n` +
      `  Then restart opencode.`;
    console.error(msg);
    throw new Error(msg);
  }

  return {
    type: "oauth",
    access: oauth.accessToken,
    refresh: oauth.refreshToken,
    expires,
    tokenURL: TOKEN_URL,
    redirectURI: REDIRECT_URI,
  };
}

function isUsableOAuth(auth) {
  return (
    auth?.type === "oauth" &&
    typeof auth.access === "string" &&
    auth.access.length > 0 &&
    typeof auth.refresh === "string" &&
    auth.refresh.length > 0 &&
    typeof auth.expires === "number" &&
    Number.isFinite(auth.expires)
  );
}

async function importClaudeCredentials(client) {
  const imported = await loadClaudeCredentials();
  await client.auth.set({
    path: { id: "anthropic" },
    body: imported,
  });
  return imported;
}

async function ensureAnthropicOAuth(client, getAuth) {
  const current = await getAuth();
  if (isUsableOAuth(current)) {
    return current;
  }
  return importClaudeCredentials(client);
}

async function refreshAnthropicOAuth(client, current) {
  const response = await fetch(current.tokenURL || TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: current.refresh,
      client_id: CLIENT_ID,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const json = await response.json();
  const refreshed = {
    type: "oauth",
    refresh: json.refresh_token,
    access: json.access_token,
    expires: Date.now() + json.expires_in * 1000,
    tokenURL: current.tokenURL || TOKEN_URL,
    redirectURI: current.redirectURI || REDIRECT_URI,
  };

  await client.auth.set({
    path: { id: "anthropic" },
    body: refreshed,
  });

  return refreshed;
}

function shouldRecoverAuth(response) {
  return response.status === 401 || response.status === 403;
}

function getRequestURL(input) {
  try {
    if (typeof input === "string" || input instanceof URL) {
      return new URL(input.toString());
    }
    if (input instanceof Request) {
      return new URL(input.url);
    }
  } catch {
    return null;
  }

  return null;
}

function isAnthropicMessagesRequest(url) {
  return (
    url &&
    (url.hostname === "api.anthropic.com" ||
      url.hostname === "platform.claude.com") &&
    url.pathname === "/v1/messages"
  );
}

export async function SolAnthropicBypassPlugin({ client }) {
  return {
    auth: {
      provider: "anthropic",
      async loader(getAuth) {
        const auth = await ensureAnthropicOAuth(client, getAuth);
        if (auth.type === "oauth") {
          return {
            apiKey: "",
            async fetch(input, init) {
              let current = await ensureAnthropicOAuth(client, getAuth);

              if (!current.access || current.expires < Date.now()) {
                try {
                  current = await refreshAnthropicOAuth(client, current);
                } catch {
                  current = await importClaudeCredentials(client);
                }
              }

              const execute = async (auth) => {
                const requestInit = init ? { ...init } : {};
                const requestHeaders = new Headers();
                const requestURL = getRequestURL(input);
                const isAnthropicRequest =
                  isAnthropicMessagesRequest(requestURL);

                if (input instanceof Request) {
                  input.headers.forEach((value, key) => {
                    requestHeaders.set(key, value);
                  });
                }

                if (requestInit.headers) {
                  if (requestInit.headers instanceof Headers) {
                    requestInit.headers.forEach((value, key) => {
                      requestHeaders.set(key, value);
                    });
                  } else if (Array.isArray(requestInit.headers)) {
                    for (const [key, value] of requestInit.headers) {
                      if (typeof value !== "undefined") {
                        requestHeaders.set(key, String(value));
                      }
                    }
                  } else {
                    for (const [key, value] of Object.entries(
                      requestInit.headers,
                    )) {
                      if (typeof value !== "undefined") {
                        requestHeaders.set(key, String(value));
                      }
                    }
                  }
                }

                requestHeaders.set("authorization", `Bearer ${auth.access}`);
                requestHeaders.delete("x-api-key");

                if (isAnthropicRequest) {
                  const incomingBeta =
                    requestHeaders.get("anthropic-beta") || "";
                  const incomingBetasList = incomingBeta
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean);
                  const mergedBetas = [
                    ...new Set(["oauth-2025-04-20", ...incomingBetasList]),
                  ].join(",");

                  requestHeaders.set("anthropic-beta", mergedBetas);
                }

                let requestInput = input;
                let body = requestInit.body;

                if (
                  isAnthropicRequest &&
                  requestURL &&
                  !requestURL.searchParams.has("beta")
                ) {
                  requestURL.searchParams.set("beta", "true");
                  requestInput =
                    input instanceof Request
                      ? new Request(requestURL.toString(), input)
                      : requestURL;
                }

                return fetch(requestInput, {
                  ...requestInit,
                  body,
                  headers: requestHeaders,
                });
              };

              let response = await execute(current);
              if (shouldRecoverAuth(response)) {
                current = await importClaudeCredentials(client);
                response = await execute(current);
              }

              return response;
            },
          };
        }

        return {};
      },
      methods: [
        {
          label: "Import Claude Code OAuth",
          type: "oauth",
          authorize: async () => {
            const imported = await loadClaudeCredentials();
            return {
              type: "success",
              ...imported,
            };
          },
        },
        {
          provider: "anthropic",
          label: "Manually enter API Key",
          type: "api",
        },
      ],
    },
  };
}

export default SolAnthropicBypassPlugin;
