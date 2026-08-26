import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRoot } from "solid-js";
import { createSignal } from "solid-js";

const { mockSet } = vi.hoisted(() => {
  const mockSet = vi.fn(() => Promise.resolve());
  return { mockSet };
});

vi.mock("webextension-polyfill", () => ({
  default: {
    storage: {
      local: { get: vi.fn(() => Promise.resolve({})), set: mockSet },
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
  },
}));

import { useCustomShortcutRecorder } from "../src/hooks/useCustomShortcutRecorder";

function makeKeyEvent(init: KeyboardEventInit & { key: string }): KeyboardEvent {
  return new KeyboardEvent("keydown", init);
}

describe("useCustomShortcutRecorder", () => {
  beforeEach(() => {
    mockSet.mockReset();
    mockSet.mockResolvedValue(undefined);
  });

  it("starts not recording with no pending", async () => {
    const [get, set] = createSignal("Ctrl+Alt+Shift+S");

    let hook!: ReturnType<typeof useCustomShortcutRecorder>;
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      hook = useCustomShortcutRecorder(get, set);
    });

    expect(hook.isRecording()).toBe(false);
    expect(hook.pending()).toBeNull();
    expect(hook.pendingError()).toBeNull();

    dispose();
  });

  it("records valid combo and clears error", async () => {
    const [get, set] = createSignal("Ctrl+Alt+Shift+S");

    let hook!: ReturnType<typeof useCustomShortcutRecorder>;
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      hook = useCustomShortcutRecorder(get, set);
    });

    hook.setIsRecording(true);
    const evt = makeKeyEvent({ key: "Q", altKey: true, shiftKey: true, ctrlKey: true });
    window.dispatchEvent(evt);

    expect(hook.pending()).toBe("Ctrl+Alt+Shift+Q");
    expect(hook.pendingError()).toBeNull();

    dispose();
  });

  it("records invalid combo and sets error", async () => {
    const [get, set] = createSignal("Ctrl+Alt+Shift+S");

    let hook!: ReturnType<typeof useCustomShortcutRecorder>;
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      hook = useCustomShortcutRecorder(get, set);
    });

    hook.setIsRecording(true);
    const evt = makeKeyEvent({ key: "s", ctrlKey: true });
    window.dispatchEvent(evt);

    expect(hook.pending()).toBe("Ctrl+S");
    expect(hook.pendingError()).not.toBeNull();

    dispose();
  });

  it("Escape cancels recording", async () => {
    const [get, set] = createSignal("Ctrl+Alt+Shift+S");

    let hook!: ReturnType<typeof useCustomShortcutRecorder>;
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      hook = useCustomShortcutRecorder(get, set);
    });

    hook.setIsRecording(true);
    hook.setPending("Ctrl+Alt+Shift+Q");
    const esc = makeKeyEvent({ key: "Escape" });
    window.dispatchEvent(esc);

    expect(hook.isRecording()).toBe(false);
    expect(hook.pending()).toBeNull();

    dispose();
  });

  it("handleSaveCustom persists valid pending and flashes", async () => {
    const [get, set] = createSignal("Ctrl+Alt+Shift+S");

    let hook!: ReturnType<typeof useCustomShortcutRecorder>;
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      hook = useCustomShortcutRecorder(get, set);
    });

    hook.setIsRecording(true);
    hook.setPending("Alt+Shift+Q");
    await hook.handleSaveCustom();

    expect(mockSet).toHaveBeenCalledWith({ customShortcut: "Alt+Shift+Q" });
    expect(get()).toBe("Alt+Shift+Q");
    expect(hook.isRecording()).toBe(false);
    expect(hook.saveFlash()).toBe(true);

    dispose();
  });

  it("handleSaveCustom rejects invalid pending", async () => {
    const [get, set] = createSignal("Ctrl+Alt+Shift+S");

    let hook!: ReturnType<typeof useCustomShortcutRecorder>;
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      hook = useCustomShortcutRecorder(get, set);
    });

    hook.setIsRecording(true);
    hook.setPending("Ctrl+S");
    await hook.handleSaveCustom();

    const notCalled = mockSet.mock.calls.every((call) => {
      const arg = call[0] as { customShortcut?: string };
      return arg.customShortcut !== "Ctrl+S";
    });
    expect(notCalled).toBe(true);
    expect(hook.pendingError()).not.toBeNull();

    dispose();
  });

  it("blur autosave only for valid pending", async () => {
    const [get, set] = createSignal("Ctrl+Alt+Shift+S");

    let hook!: ReturnType<typeof useCustomShortcutRecorder>;
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      hook = useCustomShortcutRecorder(get, set);
    });

    hook.setIsRecording(true);
    hook.setPending("Ctrl+Alt+Shift+Q");
    window.dispatchEvent(new Event("blur"));
    await new Promise<void>((r) => setTimeout(r, 10));
    expect(mockSet).toHaveBeenCalledWith({ customShortcut: "Ctrl+Alt+Shift+Q" });

    mockSet.mockClear();

    hook.setIsRecording(true);
    hook.setPending("Ctrl+S");
    window.dispatchEvent(new Event("blur"));
    await new Promise<void>((r) => setTimeout(r, 10));
    const wasCalledWithValid = mockSet.mock.calls.some((call) => {
      const arg = call[0] as { customShortcut?: string };
      return arg.customShortcut === "Ctrl+S";
    });
    expect(wasCalledWithValid).toBe(false);

    dispose();
  });
});
