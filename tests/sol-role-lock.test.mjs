import { describe, expect, test } from "bun:test";

import {
  buildSystemContract,
  patchSyntheticReminderText,
  resolveAgentName,
} from "../.opencode/plugins/sol-role-lock.mjs";

describe("sol-role-lock identity mapping", () => {
  test("maps known models to stable agent names", () => {
    expect(
      resolveAgentName({ providerID: "openai", modelID: "gpt-5.4" }, null),
    ).toBe("Kintsu");
    expect(
      resolveAgentName({ providerID: "openai", modelID: "gpt-5-codex" }, null),
    ).toBe("Kest");
    expect(
      resolveAgentName(
        { providerID: "anthropic", modelID: "claude-sonnet-4-6" },
        null,
      ),
    ).toBe("Kodo");
  });

  test("contract keeps agent name separate from active mode", async () => {
    const contract = await buildSystemContract(
      {
        operator: "Sol",
        agentName: "Kest",
        activeName: "Kest",
        activeMode: "Kintsu",
        ignoredMode: null,
      },
      {
        model: {
          providerID: "openai",
          modelID: "gpt-5-codex",
        },
      },
    );

    expect(contract).toContain("Agent name: Kest.");
    expect(contract).toContain("Active mode: Kintsu.");
    expect(contract).toContain("You are Kest.");
    expect(contract).toContain(
      "Follow Kintsu as a behavioral mode overlay without collapsing your name into the mode label.",
    );
    expect(contract).toContain(
      "You must not answer in a neutral assistant voice.",
    );
    expect(contract).toContain("Action restrictions do not change voice.");
    expect(contract).toContain(
      "Read-only mode changes what actions are allowed. It does not change how you speak.",
    );
    expect(contract).not.toContain("Active name: Kintsu.");
    expect(contract).not.toContain("You are Kintsu.");
  });

  test("patches plan reminders to preserve active mode voice", () => {
    const patched = patchSyntheticReminderText(`<system-reminder>
Plan mode is active. The user indicated that they do not want you to execute yet.
</system-reminder>`);

    expect(patched).toContain("## Identity And Mode Preservation");
    expect(patched).toContain("They do not change voice, cadence, or style.");
    expect(patched).toContain(
      "If a role lock or active mode exists, remain fully in that mode while obeying these action constraints.",
    );
  });
});
