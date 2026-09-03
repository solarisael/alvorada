import { Data, Duration, Effect, Fiber, Option, Ref, Runtime, Scope } from "effect";

// The summon control, the reliquary dialog, and the route rail. The DOM owns
// meaning: phase rides `data-phase` on the dialog, selection rides
// `data-selected` on each option. This module owns timing and input only.

export class NavigationPartMissing extends Data.TaggedError("NavigationPartMissing")<{
  readonly dialog: string;
  readonly part: string;
}> {
  override get message(): string {
    return `navigation #${this.dialog}: ${this.part} not found`;
  }
}

type Phase = "veil" | "panel" | "ready" | "closing";

const beat = {
  panel: Duration.millis(180),
  ready: Duration.millis(450),
  close: Duration.millis(520),
} as const;

const keys_back = new Set(["arrowup", "arrowleft", "w", "a"]);
const keys_forward = new Set(["arrowdown", "arrowright", "s", "d"]);

interface Parts {
  readonly dialog: HTMLDialogElement;
  readonly toggle: HTMLButtonElement;
  readonly panel: HTMLElement;
  readonly release: HTMLButtonElement;
  readonly title: HTMLElement;
  readonly count: HTMLElement;
  readonly options: ReadonlyArray<HTMLAnchorElement>;
}

const find_part = <T extends Element>(
  dialog: HTMLDialogElement,
  part: string,
  selector: string,
  guard: (candidate: Element | null) => candidate is T,
  root: ParentNode = dialog,
): Effect.Effect<T, NavigationPartMissing> => {
  const candidate = root.querySelector(selector);
  return guard(candidate)
    ? Effect.succeed(candidate)
    : Effect.fail(new NavigationPartMissing({ dialog: dialog.id, part }));
};

const is_button = (candidate: Element | null): candidate is HTMLButtonElement =>
  candidate instanceof HTMLButtonElement;
const is_element = (candidate: Element | null): candidate is HTMLElement =>
  candidate instanceof HTMLElement;

const gather_parts = (
  dialog: HTMLDialogElement,
): Effect.Effect<Parts, NavigationPartMissing> =>
  Effect.gen(function* () {
    const toggle = yield* find_part(
      dialog,
      "summon",
      `[data-sol-navigation-summon][aria-controls="${dialog.id}"]`,
      is_button,
      document,
    );
    const panel = yield* find_part(dialog, "reliquary", "[data-sol-navigation-reliquary]", is_element);
    const release = yield* find_part(dialog, "release", "[data-sol-navigation-release]", is_button);
    const title = yield* find_part(dialog, "title", "[data-sol-navigation-title]", is_element);
    const count = yield* find_part(dialog, "count", "[data-sol-navigation-count]", is_element);
    const options = [...dialog.querySelectorAll("[data-sol-navigation-option]")].filter(
      (candidate): candidate is HTMLAnchorElement => candidate instanceof HTMLAnchorElement,
    );
    if (options.length === 0) {
      return yield* Effect.fail(new NavigationPartMissing({ dialog: dialog.id, part: "options" }));
    }
    return { dialog, toggle, panel, release, title, count, options };
  });

// A DOM listener whose lifetime is the enclosing scope. The handler runs on the
// event thread so `preventDefault` still lands; anything timed forks inside it.
const listen = <E extends Event>(
  target: EventTarget,
  type: string,
  handler: (event: E) => Effect.Effect<void, never, Scope.Scope>,
): Effect.Effect<void, never, Scope.Scope> =>
  Effect.gen(function* () {
    const runtime = yield* Effect.runtime<Scope.Scope>();
    const run = Runtime.runSync(runtime);
    const listener = (event: Event) => run(handler(event as E));
    yield* Effect.acquireRelease(
      Effect.sync(() => target.addEventListener(type, listener)),
      () => Effect.sync(() => target.removeEventListener(type, listener)),
    );
  });

const mount = (dialog: HTMLDialogElement): Effect.Effect<void, NavigationPartMissing, Scope.Scope> =>
  Effect.gen(function* () {
    const parts = yield* gather_parts(dialog);
    const { toggle, panel, release, title, count, options } = parts;

    const index = yield* Ref.make(
      Math.max(0, options.findIndex((option) => option.dataset["selected"] === "true")),
    );
    const sequence = yield* Ref.make(Option.none<Fiber.RuntimeFiber<void>>());
    const return_focus = yield* Ref.make(Option.none<HTMLElement>());

    const phase = (): Phase | undefined => dialog.dataset["phase"] as Phase | undefined;
    const set_phase = (next: Phase | undefined) =>
      Effect.sync(() => {
        if (next === undefined) delete dialog.dataset["phase"];
        else dialog.dataset["phase"] = next;
      });
    const closing = () => phase() === "closing";
    const ready = () => phase() === "ready";

    const select = (next: number, focus = false) =>
      Effect.gen(function* () {
        const wrapped = ((next % options.length) + options.length) % options.length;
        yield* Ref.set(index, wrapped);
        for (const [option_index, option] of options.entries()) {
          const selected = option_index === wrapped;
          option.dataset["selected"] = String(selected);
          option.tabIndex = selected ? 0 : -1;
        }
        const option = options[wrapped];
        if (option === undefined) return;
        title.textContent = option.getAttribute("aria-label") ?? option.textContent.trim();
        count.textContent = String(wrapped + 1).padStart(2, "0");
        if (focus) option.focus();
      });

    // Replace whatever timed sequence is running with a new one.
    const run_sequence = (body: Effect.Effect<void>) =>
      Effect.gen(function* () {
        const previous = yield* Ref.get(sequence);
        if (Option.isSome(previous)) yield* Fiber.interruptFork(previous.value);
        const fiber = yield* Effect.forkScoped(body);
        yield* Ref.set(sequence, Option.some(fiber));
      });

    const show = Effect.gen(function* () {
      if (dialog.open || closing()) return;
      const active = document.activeElement;
      yield* Ref.set(return_focus, is_element(active) ? Option.some(active) : Option.none());
      panel.inert = true;
      yield* set_phase("veil");
      dialog.showModal();
      yield* run_sequence(
        Effect.gen(function* () {
          yield* Effect.sleep(beat.panel);
          yield* set_phase("panel");
          yield* Effect.sleep(Duration.subtract(beat.ready, beat.panel));
          panel.inert = false;
          yield* set_phase("ready");
          yield* select(yield* Ref.get(index), true);
        }),
      );
    });

    const hide = Effect.gen(function* () {
      if (!dialog.open || closing()) return;
      panel.inert = true;
      yield* set_phase("closing");
      yield* run_sequence(
        Effect.gen(function* () {
          yield* Effect.sleep(beat.close);
          dialog.close();
          yield* set_phase(undefined);
          const previous = yield* Ref.get(return_focus);
          if (Option.isSome(previous)) previous.value.focus();
          yield* Ref.set(return_focus, Option.none());
        }),
      );
    });

    const move = (step: number) =>
      Effect.gen(function* () {
        if (ready()) yield* select((yield* Ref.get(index)) + step, true);
      });

    yield* listen(toggle, "click", () => show);
    yield* listen(release, "click", () => hide);
    yield* listen<Event>(dialog, "cancel", (event) => {
      event.preventDefault();
      return hide;
    });
    yield* listen<PointerEvent>(dialog, "pointerdown", (event) =>
      event.target === dialog ? hide : Effect.void,
    );
    yield* listen<KeyboardEvent>(dialog, "keydown", (event) => {
      const key = event.key.toLowerCase();
      if (keys_back.has(key)) {
        event.preventDefault();
        return move(-1);
      }
      if (keys_forward.has(key)) {
        event.preventDefault();
        return move(1);
      }
      if (key === "home" && ready()) {
        event.preventDefault();
        return select(0, true);
      }
      if (key === "end" && ready()) {
        event.preventDefault();
        return select(options.length - 1, true);
      }
      return Effect.void;
    });
    for (const [option_index, option] of options.entries()) {
      yield* listen(option, "focus", () => select(option_index));
      yield* listen(option, "pointerenter", () => select(option_index));
    }
    yield* listen<KeyboardEvent>(document, "keydown", (event) => {
      if (
        event.key !== "Escape" ||
        event.defaultPrevented ||
        dialog.open ||
        document.querySelector("dialog[open]") !== null
      ) {
        return Effect.void;
      }
      event.preventDefault();
      return show;
    });
  });

// Mount every navigation dialog under `root`. Listeners and any running
// choreography live exactly as long as the scope this runs in.
export const mount_navigation = (
  root: ParentNode = document,
): Effect.Effect<void, NavigationPartMissing, Scope.Scope> =>
  Effect.forEach(
    [...root.querySelectorAll("[data-sol-navigation]")].filter(
      (candidate): candidate is HTMLDialogElement => candidate instanceof HTMLDialogElement,
    ),
    mount,
    { discard: true },
  );

// The page-lifetime program: mount, then hold the scope open until the fiber
// is interrupted (page unload, or a test tearing the DOM down).
export const navigation_program = (
  root: ParentNode = document,
): Effect.Effect<never, NavigationPartMissing> =>
  mount_navigation(root).pipe(Effect.andThen(Effect.never), Effect.scoped);
