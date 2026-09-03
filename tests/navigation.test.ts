import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { Cause, Effect, Exit, Fiber, Option } from "effect";

GlobalRegistrator.register();

const { NavigationPartMissing, mount_navigation, navigation_program } = await import(
  "../src/site/navigation/navigation.ts"
);

const markup = (options: ReadonlyArray<string> = ["Hearth", "Writing", "Work", "About"]) => `
  <button type="button" data-sol-navigation-summon aria-controls="nav">Esc</button>
  <dialog id="nav" data-sol-navigation>
    <div data-sol-navigation-reliquary>
      <button type="button" data-sol-navigation-release>Release</button>
      <ul>
        ${options
          .map(
            (label, index) =>
              `<li><a href="/${label.toLowerCase()}" aria-label="${label}" data-sol-navigation-option data-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}">${label}</a></li>`,
          )
          .join("")}
      </ul>
      <span data-sol-navigation-count>01</span>
      <h2 data-sol-navigation-title>Hearth</h2>
    </div>
  </dialog>
`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const key = (target: EventTarget, name: string) =>
  target.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true }));

let program: Fiber.RuntimeFiber<never, InstanceType<typeof NavigationPartMissing>> | undefined;

const boot = (html = markup()) => {
  document.body.innerHTML = html;
  program = Effect.runFork(navigation_program(document));
};

const dialog = () => document.getElementById("nav") as HTMLDialogElement;
const options = () => [...document.querySelectorAll<HTMLAnchorElement>("[data-sol-navigation-option]")];
const option = (index: number) => options()[index] ?? null;
const selected = () => options().findIndex((option) => option.dataset["selected"] === "true");

beforeAll(() => {
  // happy-dom does not implement <dialog>.showModal; keep the open flag honest.
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});

afterEach(async () => {
  if (program) await Effect.runPromise(Fiber.interrupt(program));
  program = undefined;
  document.body.innerHTML = "";
});

const failure_part = (exit: Exit.Exit<unknown, InstanceType<typeof NavigationPartMissing>>) => {
  expect(Exit.isFailure(exit)).toBe(true);
  if (!Exit.isFailure(exit)) return undefined;
  const failure = Cause.failureOption(exit.cause);
  expect(Option.isSome(failure)).toBe(true);
  if (!Option.isSome(failure)) return undefined;
  expect(failure.value._tag).toBe("NavigationPartMissing");
  expect(failure.value.dialog).toBe("nav");
  return failure.value.part;
};

describe("navigation mount", () => {
  test("refuses markup that lacks a required part, naming it", async () => {
    document.body.innerHTML = markup().replace("data-sol-navigation-release", "");
    const exit = await Effect.runPromiseExit(Effect.scoped(mount_navigation(document)));
    expect(failure_part(exit)).toBe("release");
  });

  test("refuses a dialog with no options", async () => {
    document.body.innerHTML = markup([]);
    const exit = await Effect.runPromiseExit(Effect.scoped(mount_navigation(document)));
    expect(failure_part(exit)).toBe("options");
  });
});

describe("navigation choreography", () => {
  test("Escape on the page opens: veil, then panel, then ready with the current option focused", async () => {
    boot();
    key(document, "Escape");
    expect(dialog().open).toBe(true);
    expect(dialog().dataset["phase"]).toBe("veil");
    await sleep(220);
    expect(dialog().dataset["phase"]).toBe("panel");
    await sleep(300);
    expect(dialog().dataset["phase"]).toBe("ready");
    expect(document.activeElement).toBe(option(0));
  });

  test("Release closes after the closing beat and returns focus to the summoner", async () => {
    boot();
    const summon = document.querySelector<HTMLButtonElement>("[data-sol-navigation-summon]")!;
    summon.focus();
    summon.click();
    await sleep(500);
    expect(dialog().dataset["phase"]).toBe("ready");
    document.querySelector<HTMLButtonElement>("[data-sol-navigation-release]")!.click();
    expect(dialog().dataset["phase"]).toBe("closing");
    expect(dialog().open).toBe(true);
    await sleep(560);
    expect(dialog().open).toBe(false);
    expect(dialog().dataset["phase"]).toBeUndefined();
    expect(document.activeElement).toBe(summon);
  });

  test("closing during the opening sequence interrupts it; the dialog never reaches ready", async () => {
    boot();
    key(document, "Escape");
    await sleep(50);
    document.querySelector<HTMLButtonElement>("[data-sol-navigation-release]")!.click();
    expect(dialog().dataset["phase"]).toBe("closing");
    await sleep(600);
    expect(dialog().open).toBe(false);
    expect(dialog().dataset["phase"]).toBeUndefined();
  });

  test("a second Escape while open does not reopen or reset the phase", async () => {
    boot();
    key(document, "Escape");
    await sleep(500);
    key(document, "Escape");
    expect(dialog().dataset["phase"]).toBe("ready");
  });
});

describe("navigation selection", () => {
  const open_ready = async () => {
    boot();
    key(document, "Escape");
    await sleep(500);
  };

  test("arrows and WASD move the selection and wrap at both ends", async () => {
    await open_ready();
    key(dialog(), "ArrowDown");
    expect(selected()).toBe(1);
    key(dialog(), "s");
    expect(selected()).toBe(2);
    key(dialog(), "ArrowUp");
    key(dialog(), "w");
    key(dialog(), "w");
    expect(selected()).toBe(3);
    key(dialog(), "d");
    expect(selected()).toBe(0);
  });

  test("selection updates title, count, tabindex, and focus", async () => {
    await open_ready();
    key(dialog(), "End");
    expect(selected()).toBe(3);
    expect(document.querySelector("[data-sol-navigation-title]")!.textContent).toBe("About");
    expect(document.querySelector("[data-sol-navigation-count]")!.textContent).toBe("04");
    expect(options().map((option) => option.tabIndex)).toEqual([-1, -1, -1, 0]);
    expect(document.activeElement).toBe(option(3));
    key(dialog(), "Home");
    expect(selected()).toBe(0);
  });

  test("keys are inert before the ready beat", async () => {
    boot();
    key(document, "Escape");
    await sleep(50);
    key(dialog(), "ArrowDown");
    expect(selected()).toBe(0);
  });

  test("pointer hover selects without stealing focus", async () => {
    await open_ready();
    options()[2]!.dispatchEvent(new Event("pointerenter"));
    expect(selected()).toBe(2);
    expect(document.activeElement).toBe(option(0));
  });
});

describe("navigation teardown", () => {
  test("interrupting the program removes every listener", async () => {
    boot();
    await Effect.runPromise(Fiber.interrupt(program!));
    program = undefined;
    key(document, "Escape");
    expect(dialog().open).toBe(false);
    expect(dialog().dataset["phase"]).toBeUndefined();
  });
});
