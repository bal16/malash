import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock webextension-polyfill before importing background
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockQuery = vi.fn();
const mockSendMessage = vi.fn();
const onInstalledAdd = vi.fn();
const onCommandAdd = vi.fn();
const onChangedAdd = vi.fn();
const onMessageAdd = vi.fn();

vi.mock("webextension-polyfill", () => ({
  default: {
    storage: {
      local: { get: mockGet, set: mockSet },
      onChanged: { addListener: onChangedAdd },
    },
    tabs: { query: mockQuery, sendMessage: mockSendMessage },
    runtime: {
      onInstalled: { addListener: onInstalledAdd },
      onMessage: { addListener: onMessageAdd },
    },
    commands: { onCommand: { addListener: onCommandAdd } },
  },
}));

describe("background dual-trigger", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockGet.mockResolvedValue({});
    mockSet.mockResolvedValue(undefined);
    mockQuery.mockResolvedValue([]);
    mockSendMessage.mockResolvedValue(undefined);
  });

  it("registers toggle-request handler", async () => {
    await import("../src/background");
    expect(onMessageAdd).toHaveBeenCalled();
    const handler = onMessageAdd.mock.calls[0][0];
    expect(typeof handler).toBe("function");
  });

  it("seeds customShortcut onInstalled", async () => {
    mockGet.mockResolvedValue({});
    await import("../src/background");
    // trigger onInstalled handler
    const installedHandler = onInstalledAdd.mock.calls[0][0];
    await installedHandler();
    expect(mockSet).toHaveBeenCalled();
    const setArg = mockSet.mock.calls.find(c => c[0].customShortcut);
    expect(setArg).toBeDefined();
    expect(setArg[0].customShortcut).toBe("Ctrl+Alt+Shift+S");
  });

  it("fan-out queries all tabs not just active", async () => {
    await import("../src/background");
    const storageHandler = onChangedAdd.mock.calls[0][0];
    mockQuery.mockResolvedValue([
      { id: 1, url: "https://example.com" },
      { id: 2, url: "chrome://extensions" },
      { id: 3, url: "https://other.com" },
    ]);
    mockGet.mockResolvedValue({ isActive: true, scrollSpeed: 5, pauseOnMouseMove: true });
    mockSendMessage.mockResolvedValue(undefined);
    await storageHandler({ isActive: { newValue: true } }, "local");
    expect(mockQuery).toHaveBeenCalledWith({});
    // should send to http tabs only (1 and 3), not chrome://
    expect(mockSendMessage).toHaveBeenCalledTimes(2);
  });
});
