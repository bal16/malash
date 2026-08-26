import browser from "webextension-polyfill";
import { DEFAULT_SHORTCUT } from "./content/shortcut";

// This function ONLY toggles the `isActive` state in storage.
const toggleIsActiveState = async () => {
  const { isActive } = await browser.storage.local.get("isActive");
  await browser.storage.local.set({ isActive: !isActive });
};

browser.runtime.onInstalled.addListener(async () => {
  const existing = (await browser.storage.local.get("customShortcut")) as {
    customShortcut?: string;
  };
  await browser.storage.local.set({
    scrollSpeed: 5,
    isActive: false,
    pauseOnMouseMove: true,
    customShortcut: existing.customShortcut ?? DEFAULT_SHORTCUT,
  });
  console.log("Installed Successfully.");
});

// Migration: ensure customShortcut exists for existing installs
(async () => {
  try {
    const v = (await browser.storage.local.get("customShortcut")) as {
      customShortcut?: string;
    };
    if (!v.customShortcut) {
      await browser.storage.local.set({ customShortcut: DEFAULT_SHORTCUT });
    }
  } catch {}
})();

browser.runtime.onMessage.addListener(async (msg: unknown) => {
  const m = msg as { action?: string };
  if (m?.action === "toggle-request") {
    await toggleIsActiveState();
  }
});

// The keyboard shortcut now only changes the state.
// The onChanged listener below will handle sending the message to the content script.
browser.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-autoscroll") {
    await toggleIsActiveState();
  }
});

// This listener is the central hub for reacting to state changes from any source (popup or keyboard shortcut).
browser.storage.onChanged.addListener(async (changes, areaName) => {
  // We only care about local storage changes.
  if (areaName !== "local") {
    return;
  }

  // If any relevant state changed, we need to sync the content script.
  if (changes.isActive || changes.scrollSpeed || changes.pauseOnMouseMove) {
    const tabs = await browser.tabs.query({});
    const eligible = tabs.filter(
      (t) => t.id != null && t.url?.startsWith("http"),
    );

    if (eligible.length === 0) return;

    try {
      // Get the full current state to send to the content script
      const { isActive, scrollSpeed, pauseOnMouseMove } =
        await browser.storage.local.get([
          "isActive",
          "scrollSpeed",
          "pauseOnMouseMove",
        ]);
      const state = {
        isActive: (isActive as boolean) ?? false,
        scrollSpeed: (scrollSpeed as number) ?? 5,
        pauseOnMouseMove: (pauseOnMouseMove as boolean) ?? true,
      };
      for (const tab of eligible) {
        try {
          await browser.tabs.sendMessage(tab.id!, {
            action: "toggle",
            state,
          });
        } catch (err) {
          // This can happen on special pages like chrome://extensions, which is normal.
          console.log(
            `Could not sync tab ${tab.id}: ${(err as Error).message}`,
          );
        }
      }
    } catch (err) {
      console.log(`Could not fetch state for fan-out: ${(err as Error).message}`);
    }
  }
});
