import { readFile } from "node:fs/promises";

const HOME = (process.env.USERPROFILE || process.env.HOME || ".").replace(/\\/g, "/");
const CLAUDE_CREDENTIALS_FILE = `${HOME}/.claude/.credentials.json`;
const TOKEN_URL = "https://platform.claude.com/v1/oauth/token";
const REDIRECT_URI = "https://platform.claude.com/oauth/code/callback";
const CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
const TOOL_PREFIX = "mcp_";
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
  if (!oauth?.accessToken || !oauth?.refreshToken || !Number.isFinite(expires)) {
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

function stripOAuthUnsupportedFields(body) {
  if (!body || typeof body !== "object") return body;
  if (Array.isArray(body.system)) {
    body.system = body.system.map((item) => {
      if (!item || typeof item !== "object" || item.type !== "text") {
        return item;
      }
      const next = { ...item };
      delete next.cache_control;
      return next;
    });
  }
  return body;
}

function sanitizePromptText(body) {
  if (!Array.isArray(body.system)) return body;
  body.system = body.system.map((item) => {
    if (item?.type === "text" && item.text) {
      return {
        ...item,
        text: item.text.replace(/OpenCode/g, "Claude Code").replace(/opencode/gi, "Claude"),
      };
    }
    return item;
  });
  return body;
}

function prefixTools(body) {
  if (Array.isArray(body.tools)) {
    body.tools = body.tools.map((tool) => ({
      ...tool,
      name: tool.name ? `${TOOL_PREFIX}${tool.name}` : tool.name,
    }));
  }

  if (Array.isArray(body.messages)) {
    body.messages = body.messages.map((message) => {
      if (Array.isArray(message.content)) {
        message.content = message.content.map((block) => {
          if (block?.type === "tool_use" && block.name) {
            return {
              ...block,
              name: `${TOOL_PREFIX}${block.name}`,
            };
          }
          return block;
        });
      }
      return message;
    });
  }

  return body;
}

function restoreToolNames(response) {
  if (!response.body) {
    return response;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }

      let text = decoder.decode(value, { stream: true });
      text = text.replace(/"name"\s*:\s*"mcp_([^"]+)"/g, '"name": "$1"');
      controller.enqueue(encoder.encode(text));
    },
  });

  return new Response(stream, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

function shouldRecoverAuth(response) {
  return response.status === 401 || response.status === 403;
}

export async function SolAnthropicBypassPlugin({ client }) {
  return {
    "experimental.chat.system.transform": (input, output) => {
      const prefix = "You are Claude Code, Anthropic's official CLI for Claude.";
      if (input.model?.providerID === "anthropic") {
        output.system.unshift(prefix);
        if (output.system[1]) {
          output.system[1] = prefix + "\n\n" + output.system[1];
        }
      }
    },
    auth: {
      provider: "anthropic",
      async loader(getAuth, provider) {
        const auth = await ensureAnthropicOAuth(client, getAuth);
        if (auth.type === "oauth") {
          for (const model of Object.values(provider.models)) {
            model.cost = {
              input: 0,
              output: 0,
              cache: { read: 0, write: 0 },
            };
          }

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
                    for (const [key, value] of Object.entries(requestInit.headers)) {
                      if (typeof value !== "undefined") {
                        requestHeaders.set(key, String(value));
                      }
                    }
                  }
                }

                const incomingBeta = requestHeaders.get("anthropic-beta") || "";
                const incomingBetasList = incomingBeta
                  .split(",")
                  .map((value) => value.trim())
                  .filter(Boolean);
                const mergedBetas = [
                  ...new Set(["oauth-2025-04-20", "interleaved-thinking-2025-05-14", ...incomingBetasList]),
                ].join(",");

                requestHeaders.set("authorization", `Bearer ${auth.access}`);
                requestHeaders.set("anthropic-beta", mergedBetas);
                requestHeaders.set("user-agent", "claude-cli/2.1.2 (external, cli)");
                requestHeaders.delete("x-api-key");

                let body = requestInit.body;
                if (body && typeof body === "string") {
                  try {
                    const parsedBody = JSON.parse(body);
                    stripOAuthUnsupportedFields(parsedBody);
                    sanitizePromptText(parsedBody);
                    prefixTools(parsedBody);
                    body = JSON.stringify(parsedBody);
                  } catch {
                    // ignore parse errors
                  }
                }

                let requestInput = input;
                let requestURL = null;
                try {
                  if (typeof input === "string" || input instanceof URL) {
                    requestURL = new URL(input.toString());
                  } else if (input instanceof Request) {
                    requestURL = new URL(input.url);
                  }
                } catch {
                  requestURL = null;
                }

                if (
                  requestURL &&
                  requestURL.pathname === "/v1/messages" &&
                  !requestURL.searchParams.has("beta")
                ) {
                  requestURL.searchParams.set("beta", "true");
                  requestInput = input instanceof Request ? new Request(requestURL.toString(), input) : requestURL;
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

              return restoreToolNames(response);
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

