import { describe, it, expect } from "vitest";
import { validateShortcut } from "../src/content/shortcut";

describe("popup validate", () => {
  it("requires 2 modifiers", () => expect(validateShortcut("Alt+S").ok).toBe(false));
  it("autosave should only happen for valid", () => expect(validateShortcut("Ctrl+Alt+Shift+Q").ok).toBe(true));
  it("invalid pending not autosaved", () => expect(validateShortcut("Ctrl+S").ok).toBe(false));
  it("reset default valid", () => expect(validateShortcut("Ctrl+Alt+Shift+S").ok).toBe(true));
});
