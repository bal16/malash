import { describe, it, expect } from "vitest";
import { eventToString, validateShortcut, isPlatformEquivalent, DEFAULT_SHORTCUT } from "../src/content/shortcut";

function mkEvent(over: Partial<KeyboardEvent> & {key:string, ctrlKey?:boolean, altKey?:boolean, shiftKey?:boolean, metaKey?:boolean}): KeyboardEvent {
  return {
    key: over.key,
    ctrlKey: !!over.ctrlKey,
    altKey: !!over.altKey,
    shiftKey: !!over.shiftKey,
    metaKey: !!over.metaKey,
    repeat: false,
  } as KeyboardEvent;
}

describe("eventToString", () => {
  it("formats Ctrl+Alt+Shift+S", () => {
    expect(eventToString(mkEvent({key:"s", ctrlKey:true, altKey:true, shiftKey:true}))).toBe("Ctrl+Alt+Shift+S");
  });
  it("sorts modifiers Ctrl Alt Shift Meta", () => {
    expect(eventToString(mkEvent({key:"q", metaKey:true, shiftKey:true, altKey:true}))).toBe("Alt+Shift+Meta+Q");
  });
  it("uppercases single char key", () => {
    expect(eventToString(mkEvent({key:"a", altKey:true, shiftKey:true}))).toBe("Alt+Shift+A");
  });
  it("preserves F keys and Arrow", () => {
    expect(eventToString(mkEvent({key:"F5", ctrlKey:true, shiftKey:true}))).toBe("Ctrl+Shift+F5");
    expect(eventToString(mkEvent({key:"ArrowDown", ctrlKey:true, altKey:true}))).toBe("Ctrl+Alt+ArrowDown");
  });
});

describe("validateShortcut", () => {
  it("rejects S alone", () => expect(validateShortcut("S").ok).toBe(false));
  it("rejects Ctrl+S (only 1 modifier)", () => expect(validateShortcut("Ctrl+S").ok).toBe(false));
  it("rejects Alt+S (only 1 modifier)", () => expect(validateShortcut("Alt+S").ok).toBe(false));
  it("accepts Alt+Shift+S", () => expect(validateShortcut("Alt+Shift+S").ok).toBe(true));
  it("accepts Ctrl+Alt+Shift+S", () => expect(validateShortcut("Ctrl+Alt+Shift+S").ok).toBe(true));
  it("accepts Meta+Alt+Shift+S", () => expect(validateShortcut("Meta+Alt+Shift+S").ok).toBe(true));
  it("rejects F5 alone", () => expect(validateShortcut("F5").ok).toBe(false));
  it("rejects Ctrl+F5 (1 modifier)", () => expect(validateShortcut("Ctrl+F5").ok).toBe(false));
  it("accepts Ctrl+Shift+F5", () => expect(validateShortcut("Ctrl+Shift+F5").ok).toBe(true));
});

describe("isPlatformEquivalent", () => {
  it("treats Ctrl+Alt+Shift+S equiv to Meta+Alt+Shift+S", () => {
    expect(isPlatformEquivalent("Ctrl+Alt+Shift+S","Meta+Alt+Shift+S")).toBe(true);
  });
  it("not equiv when key differs", () => {
    expect(isPlatformEquivalent("Ctrl+Alt+Shift+S","Ctrl+Alt+Shift+Q")).toBe(false);
  });
  it("default constant is Ctrl+Alt+Shift+S", () => {
    expect(DEFAULT_SHORTCUT).toBe("Ctrl+Alt+Shift+S");
  });
});
