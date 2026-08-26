import browser from "webextension-polyfill";
import {
  DEFAULT_SHORTCUT,
  eventToString,
  isPlatformEquivalent,
} from "./content/shortcut";

let scrollInterval: number | null = null;
let resumeTimeoutId: number | null = null;
let lastMousePosition = { x: 0, y: 0 };

// --- State synced from browser.storage ---
let isGloballyActive = false;
let currentScrollSpeed = 5;
let pauseOnMouseMoveEnabled = true;
let customShortcut: string = DEFAULT_SHORTCUT;

// --- Runtime state ---
let isPausedByMouse = false;

type IMEssage = {
  action: string;
  state: {
    isActive: boolean;
    scrollSpeed: number;
    pauseOnMouseMove: boolean;
  };
};

// Listen for explicit toggle commands from the background script
browser.runtime.onMessage.addListener((message: unknown) => {
  const msg = message as IMEssage;
  if (msg.action === "toggle") {
    // Update local state from the message
    isGloballyActive = msg.state.isActive;
    currentScrollSpeed = msg.state.scrollSpeed;
    const oldPauseOnMouseMove = pauseOnMouseMoveEnabled;
    pauseOnMouseMoveEnabled = msg.state.pauseOnMouseMove;

    // If the pause feature was toggled, update the listener
    if (oldPauseOnMouseMove !== pauseOnMouseMoveEnabled) {
      updateMouseListener();
    }

    if (isGloballyActive) {
      // If we are globally active, but paused by mouse, we should not start scrolling.
      // The resume timer will handle it.
      if (!isPausedByMouse) {
        startScrolling(currentScrollSpeed);
      }
    } else {
      // If globally toggled off, stop everything and reset state.
      stopScrolling();
    }
  }
});

// --- Core Scrolling Logic ---

function startScrolling(speed: number) {
  // Clear any existing loop first to prevent compounding speed bugs
  if (scrollInterval !== null) cancelAnimationFrame(scrollInterval);
  if (resumeTimeoutId !== null) clearTimeout(resumeTimeoutId);

  isPausedByMouse = false;
  currentScrollSpeed = speed;

  function scroll() {
    window.scrollBy(0, currentScrollSpeed);
    scrollInterval = requestAnimationFrame(scroll);
  }

  scrollInterval = requestAnimationFrame(scroll);
}

function stopScrolling() {
  if (scrollInterval !== null) {
    cancelAnimationFrame(scrollInterval);
    scrollInterval = null;
  }
  if (resumeTimeoutId !== null) {
    clearTimeout(resumeTimeoutId);
    resumeTimeoutId = null;
  }
  isPausedByMouse = false;
}

// --- Custom Shortcut Handler ---

const handleCustomShortcut = (e: KeyboardEvent) => {
  if (e.repeat) return;
  const target = e.target as HTMLElement | null;
  if (
    target &&
    (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
      (target as HTMLElement).isContentEditable)
  ) {
    return;
  }
  if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return;

  const str = eventToString(e);
  if (str !== customShortcut && !isPlatformEquivalent(str, customShortcut)) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();
  browser.runtime.sendMessage({ action: "toggle-request" });
};

// --- Event Handlers ---

const handleMouseMove = (e: MouseEvent) => {
  // This listener is active only when pauseOnMouseMoveEnabled is true.
  if (!isGloballyActive) return;

  // CRUCIAL: Check for actual physical mouse movement.
  // Programmatic scrolling can trigger 'mousemove' events with changing clientX/Y but static screenX/Y.
  if (e.screenX === lastMousePosition.x && e.screenY === lastMousePosition.y) {
    return;
  }

  lastMousePosition.x = e.screenX;
  lastMousePosition.y = e.screenY;

  // If we are currently scrolling, pause it.
  if (scrollInterval !== null) {
    isPausedByMouse = true;
    cancelAnimationFrame(scrollInterval);
    scrollInterval = null;
  }

  // Always clear the previous resume timer and set a new one.
  if (resumeTimeoutId !== null) {
    clearTimeout(resumeTimeoutId);
  }

  resumeTimeoutId = window.setTimeout(() => {
    // Only resume if the extension is still globally active.
    if (isGloballyActive) {
      startScrolling(currentScrollSpeed);
    }
  }, 1500); // 1.5-second delay before resuming
};

function updateMouseListener() {
  window.removeEventListener("mousemove", handleMouseMove);
  if (pauseOnMouseMoveEnabled) {
    window.addEventListener("mousemove", handleMouseMove);
  } else {
    // If we disable the feature while it's paused by mouse, we should resume scrolling.
    if (isPausedByMouse && isGloballyActive) {
      startScrolling(currentScrollSpeed);
    }
  }
}

// --- Initialization ---

async function initializeState() {
  try {
    const state = await browser.storage.local.get([
      "isActive",
      "scrollSpeed",
      "pauseOnMouseMove",
      "customShortcut",
    ]);

    isGloballyActive = (state.isActive as boolean) ?? false;
    currentScrollSpeed = (state.scrollSpeed as number) ?? 5;
    pauseOnMouseMoveEnabled = (state.pauseOnMouseMove as boolean) ?? true;
    customShortcut = (state.customShortcut as string) ?? DEFAULT_SHORTCUT;

    updateMouseListener();
    window.addEventListener("keydown", handleCustomShortcut, true);

    // Listen for customShortcut updates (isActive already handled via runtime message, but keep cache fresh)
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.customShortcut) {
        customShortcut = (changes.customShortcut.newValue as string) ?? DEFAULT_SHORTCUT;
      }
    });

    if (isGloballyActive) {
      startScrolling(currentScrollSpeed);
    }
  } catch (e) {
    console.error("Autoscroll: Could not initialize state from storage.", e);
  }
}

// Initialize state when the content script is first injected into the page.
initializeState();
