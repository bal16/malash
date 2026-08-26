import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRoot } from "solid-js";

type StorageChange = { newValue: unknown; oldValue?: unknown };
type StorageChanges = Record<string, StorageChange>;

const { mockGet, mockSet, addListenerCalls, mockAddListener, mockRemoveListener } = vi.hoisted(() => {
  const mockGet = vi.fn(() => Promise.resolve({} as Record<string, unknown>));
  const mockSet = vi.fn(() => Promise.resolve());
  const addListenerCalls: Array<(changes: StorageChanges, area: string) => void> = [];
  const mockAddListener = vi.fn((cb: (changes: StorageChanges, area: string) => void) => {
    addListenerCalls.push(cb);
  });
  const mockRemoveListener = vi.fn((cb: (changes: StorageChanges, area: string) => void) => {
    const idx = addListenerCalls.indexOf(cb);
    if (idx >= 0) addListenerCalls.splice(idx, 1);
  });
  return { mockGet, mockSet, addListenerCalls, mockAddListener, mockRemoveListener };
});

vi.mock("webextension-polyfill", () => ({
  default: {
    storage: {
      local: { get: mockGet, set: mockSet },
      onChanged: { addListener: mockAddListener, removeListener: mockRemoveListener },
    },
  },
}));

import { useExtensionState } from "../src/hooks/useExtensionState";

function flush() {
  return new Promise<void>((resolve) => setTimeout(resolve, 10));
}

describe("useExtensionState", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockReset();
    addListenerCalls.length = 0;
    mockAddListener.mockClear();
    mockRemoveListener.mockClear();
    mockGet.mockResolvedValue({} as Record<string, unknown>);
    mockSet.mockResolvedValue(undefined);
  });

  it("loads initial state from storage", async () => {
    mockGet.mockResolvedValue({
      isActive: true,
      scrollSpeed: 12,
      pauseOnMouseMove: false,
      customShortcut: "Ctrl+Shift+Q",
    } as unknown as Record<string, unknown>);

    let hook!: ReturnType<typeof useExtensionState>;
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      hook = useExtensionState();
    });

    await flush();

    expect(hook.isActive()).toBe(true);
    expect(hook.scrollSpeed()).toBe(12);
    expect(hook.pauseOnMouseMove()).toBe(false);
    expect(hook.customShortcut()).toBe("Ctrl+Shift+Q");

    dispose();
  });

  it("handles storage onChanged updates", async () => {
    mockGet.mockResolvedValue({} as Record<string, unknown>);

    let hook!: ReturnType<typeof useExtensionState>;
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      hook = useExtensionState();
    });
    await flush();

    expect(addListenerCalls.length).toBe(1);
    const cb = addListenerCalls[0];
    cb({ isActive: { newValue: true } } as StorageChanges, "local");
    expect(hook.isActive()).toBe(true);

    cb({ customShortcut: { newValue: "Alt+Shift+Q" } } as StorageChanges, "local");
    expect(hook.customShortcut()).toBe("Alt+Shift+Q");

    cb({ isActive: { newValue: false } } as StorageChanges, "other");
    expect(hook.isActive()).toBe(true);

    dispose();
  });

  it("handleToggle flips isActive and persists", async () => {
    mockGet.mockResolvedValue({ isActive: false } as unknown as Record<string, unknown>);

    let hook!: ReturnType<typeof useExtensionState>;
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      hook = useExtensionState();
    });
    await flush();

    expect(hook.isActive()).toBe(false);
    await hook.handleToggle();
    expect(hook.isActive()).toBe(true);
    expect(mockSet).toHaveBeenCalledWith({ isActive: true });

    dispose();
  });

  it("handleSpeedChange updates speed and persists", async () => {
    let hook!: ReturnType<typeof useExtensionState>;
    let dispose!: () => void;
    createRoot((d) => {
      dispose = d;
      hook = useExtensionState();
    });
    await flush();

    const input = { valueAsNumber: 22 } as unknown as HTMLInputElement;
    const evt = { currentTarget: input } as unknown as Event & { currentTarget: HTMLInputElement };
    await hook.handleSpeedChange(evt);
    expect(hook.scrollSpeed()).toBe(22);
    expect(mockSet).toHaveBeenCalledWith({ scrollSpeed: 22 });

    dispose();
  });
});
