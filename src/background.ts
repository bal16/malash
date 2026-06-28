import browser from "webextension-polyfill";

// This function ONLY toggles the `isActive` state in storage.
const toggleIsActiveState = async () => {
  const { isActive } = await browser.storage.local.get("isActive");
  await browser.storage.local.set({ isActive: !isActive });
};

browser.runtime.onInstalled.addListener(async () => {
  await browser.storage.local.set({
    scrollSpeed: 5,
    isActive: false,
    pauseOnMouseMove: true,
  });
  console.log("Installed Successfully.");
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
    const [activeTab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (activeTab?.id) {
      try {
        // Get the full current state to send to the content script
        const { isActive, scrollSpeed, pauseOnMouseMove } =
          await browser.storage.local.get([
            "isActive",
            "scrollSpeed",
            "pauseOnMouseMove",
          ]);
        await browser.tabs.sendMessage(activeTab.id, {
          action: "toggle",
          state: {
            isActive: isActive ?? false,
            scrollSpeed: scrollSpeed ?? 5,
            pauseOnMouseMove: pauseOnMouseMove ?? true,
          },
        });
      } catch (err) {
        // This can happen on special pages like chrome://extensions, which is normal.
        console.log(
          `Could not sync tab ${activeTab.id}: ${(err as Error).message}`,
        );
      }
    }
  }
});
