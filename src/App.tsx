import { type Component, createSignal, onCleanup, onMount } from "solid-js";
import browser from "webextension-polyfill";
import {
  DEFAULT_SHORTCUT,
  eventToString,
  validateShortcut,
} from "./content/shortcut";

/**
 * Defines the shape of our extension's state in browser.storage.local.
 * Using a TypeScript interface ensures type safety when accessing storage data.
 */
interface ExtensionState {
  isActive?: boolean;
  scrollSpeed?: number;
  pauseOnMouseMove?: boolean;
  customShortcut?: string;
}

const App: Component = () => {
  // Create signals for our reactive UI state.
  // Default values are used as placeholders until the state is loaded from storage.
  const [isActive, setIsActive] = createSignal(false);
  const [scrollSpeed, setScrollSpeed] = createSignal(5);
  const [pauseOnMouseMove, setPauseOnMouseMove] = createSignal(true);
  const [customShortcut, setCustomShortcut] = createSignal(DEFAULT_SHORTCUT);
  const [isRecording, setIsRecording] = createSignal(false);
  const [pending, setPending] = createSignal<string | null>(null);
  const [pendingError, setPendingError] = createSignal<string | null>(null);
  const [saveFlash, setSaveFlash] = createSignal(false);

  /**
   * On component mount, we load the initial state from storage and set up a listener
   * to react to any changes that happen while the popup is open.
   */
  // Conditional autosave on blur/close: only if valid pending combo
  const handleBlurAutosave = async () => {
    if (isRecording() && pending()) {
      const v = validateShortcut(pending()!);
      if (v.ok) {
        await browser.storage.local.set({ customShortcut: pending()! });
      }
    }
  };

  const handleRecordingKeyDown = (e: KeyboardEvent) => {
    if (!isRecording()) return;
    if (e.key === "Escape") {
      setIsRecording(false);
      setPending(null);
      setPendingError(null);
      e.preventDefault();
      return;
    }
    if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return;
    e.preventDefault();
    e.stopPropagation();
    const str = eventToString(e);
    const v = validateShortcut(str);
    if (!v.ok) {
      setPending(str);
      setPendingError(v.reason ?? "Invalid shortcut");
      return;
    }
    setPending(str);
    setPendingError(null);
  };

  onMount(async () => {
    // Fetch initial state from browser.storage.local, providing defaults.
    const initialState: ExtensionState = await browser.storage.local.get({
      isActive: false,
      scrollSpeed: 5,
      pauseOnMouseMove: true,
      customShortcut: DEFAULT_SHORTCUT,
    });
    setIsActive(initialState.isActive ?? false);
    setScrollSpeed(initialState.scrollSpeed ?? 5);
    setPauseOnMouseMove(initialState.pauseOnMouseMove ?? true);
    setCustomShortcut(initialState.customShortcut ?? DEFAULT_SHORTCUT);

    // Listen for changes from other parts of the extension (e.g., background script via hotkey).
    browser.storage.onChanged.addListener(handleStorageChange);
    window.addEventListener("keydown", handleRecordingKeyDown, true);
    window.addEventListener("blur", handleBlurAutosave);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") handleBlurAutosave();
    });
    window.addEventListener("beforeunload", handleBlurAutosave);
  });

  /**
   * It's crucial to clean up the listener when the popup is closed to prevent memory leaks.
   */
  onCleanup(() => {
    browser.storage.onChanged.removeListener(handleStorageChange);
    window.removeEventListener("keydown", handleRecordingKeyDown, true);
    window.removeEventListener("blur", handleBlurAutosave);
    window.removeEventListener("beforeunload", handleBlurAutosave);
  });

  /**
   * This handler is the key to real-time UI syncing. It receives change objects
   * and updates the local SolidJS signals accordingly.
   */
  const handleStorageChange = (
    changes: { [key: string]: browser.Storage.StorageChange },
    areaName: string,
  ) => {
    if (areaName === "local") {
      if (changes.isActive) {
        setIsActive(changes.isActive.newValue as boolean);
      }
      if (changes.scrollSpeed) {
        setScrollSpeed(changes.scrollSpeed.newValue as number);
      }
      if (changes.pauseOnMouseMove) {
        setPauseOnMouseMove(changes.pauseOnMouseMove.newValue as boolean);
      }
      if (changes.customShortcut) {
        setCustomShortcut(changes.customShortcut.newValue as string);
      }
    }
  };

  /**
   * Handles the state and storage update when the user clicks the toggle switch.
   */
  const handleToggle = async () => {
    const newIsActive = !isActive();
    setIsActive(newIsActive);
    await browser.storage.local.set({ isActive: newIsActive });
  };

  /**
   * Handles the state and storage update when the user interacts with the speed slider.
   */
  const handleSpeedChange = async (
    e: Event & { currentTarget: HTMLInputElement },
  ) => {
    const newSpeed = e.currentTarget.valueAsNumber;
    setScrollSpeed(newSpeed);
    await browser.storage.local.set({ scrollSpeed: newSpeed });
  };

  /**
   * Handles the state and storage update for the "Pause on Mousemove" toggle.
   */
  const handlePauseOnMoveToggle = async () => {
    const newPauseOnMove = !pauseOnMouseMove();
    setPauseOnMouseMove(newPauseOnMove);
    await browser.storage.local.set({ pauseOnMouseMove: newPauseOnMove });
  };

  const handleSaveCustom = async () => {
    if (!pending()) return;
    const v = validateShortcut(pending()!);
    if (!v.ok) {
      setPendingError(v.reason ?? "Invalid shortcut");
      return;
    }
    await browser.storage.local.set({ customShortcut: pending()! });
    setCustomShortcut(pending()!);
    setIsRecording(false);
    setPending(null);
    setPendingError(null);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
    setPending(null);
    setPendingError(null);
  };

  const handleResetCustom = async () => {
    await browser.storage.local.set({ customShortcut: DEFAULT_SHORTCUT });
    setCustomShortcut(DEFAULT_SHORTCUT);
    setIsRecording(false);
    setPending(null);
    setPendingError(null);
  };

  return (
    <div class="w-72 bg-slate-900 text-slate-100 p-4 font-sans select-none">
      {/* Header */}
      <header class="flex items-center justify-between mb-4">
        <h1 class="text-lg font-bold text-slate-200">.malash Controller</h1>
        <div class="flex items-center space-x-2">
          <span
            class={`text-xs font-medium transition-colors ${isActive() ? "text-emerald-400" : "text-slate-400"}`}
          >
            {isActive() ? "Active" : "Inactive"}
          </span>
          <div class="relative flex items-center justify-center">
            {isActive() && (
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              class={`relative inline-flex rounded-full h-3 w-3 transition-colors ${isActive() ? "bg-emerald-500" : "bg-slate-600"}`}
            />
          </div>
        </div>
      </header>

      {/* Main Controls */}
      <main class="space-y-6">
        {/* Toggle Switch */}
        <div class="flex items-center justify-between">
          <span class="font-medium text-slate-300">Enable Autoscroll</span>
          <button
            onClick={handleToggle}
            class={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${isActive() ? "bg-indigo-600" : "bg-slate-700"}`}
            role="switch"
            aria-checked={isActive()}
          >
            <span
              class={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-all duration-200 ease-in-out ${isActive() ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>

        {/* Speed Controller */}
        <div class="space-y-2">
          <div class="flex justify-between items-baseline">
            <label for="scroll-speed" class="font-medium text-slate-300">
              Scroll Speed
            </label>
            <span class="text-sm font-mono text-indigo-300 bg-indigo-900/50 px-2 py-0.5 rounded">
              {scrollSpeed()}px
            </span>
          </div>
          <input
            id="scroll-speed"
            type="range"
            min="1"
            max="50"
            step="1"
            value={scrollSpeed()}
            onInput={handleSpeedChange}
            class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        {/* Pause on Mousemove Toggle */}
        <div class="flex items-center justify-between pt-4 border-t border-slate-800">
          <span class="font-medium text-sm text-slate-300">
            Pause on mouse movement
          </span>
          <button
            onClick={handlePauseOnMoveToggle}
            class={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
              pauseOnMouseMove() ? "bg-indigo-600" : "bg-slate-700"
            }`}
            role="switch"
            aria-checked={pauseOnMouseMove()}
          >
            <span
              class={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-all duration-200 ease-in-out ${pauseOnMouseMove() ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>

        {/* Custom Shortcut */}
        <div class="pt-4 border-t border-slate-800 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-medium text-sm text-slate-300">Custom shortcut</span>
            {saveFlash() && (
              <span class="text-xs text-emerald-400">Saved {customShortcut()}</span>
            )}
          </div>
          {!isRecording() ? (
            <div class="flex items-center justify-between gap-2">
              <kbd class="font-mono text-xs text-indigo-300 bg-indigo-900/50 px-2 py-1 rounded border border-indigo-800">
                {customShortcut()}
              </kbd>
              <div class="flex gap-2">
                <button
                  onClick={() => {
                    setIsRecording(true);
                    setPending(null);
                    setPendingError(null);
                  }}
                  class="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
                >
                  Change
                </button>
                <button
                  onClick={handleResetCustom}
                  class="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <div class="space-y-2">
              <p class="text-xs text-slate-400">Press new combination… Esc to cancel</p>
              {pending() && (
                <div class="flex items-center justify-between">
                  <kbd
                    class={`font-mono text-xs px-2 py-1 rounded border ${
                      pendingError()
                        ? "text-red-300 bg-red-900/30 border-red-800"
                        : "text-emerald-300 bg-emerald-900/30 border-emerald-800"
                    }`}
                  >
                    {pending()}
                  </kbd>
                  <div class="flex gap-2">
                    <button
                      onClick={handleSaveCustom}
                      disabled={!!pendingError() || !pending()}
                      class="text-xs px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 text-white"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelRecording}
                      class="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {pendingError() && (
                <p class="text-xs text-red-400">{pendingError()}</p>
              )}
              {!pending() && (
                <div class="flex gap-2">
                  <button
                    onClick={handleCancelRecording}
                    class="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
          <p class="text-xs text-slate-500">
            Fallback when Alt+Shift+S is grabbed by browser. Both shortcuts stay active.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer class="mt-6 pt-4 border-t border-slate-700/50">
        <p class="text-center text-xs text-slate-500">
          Press{" "}
          <kbd class="font-sans font-semibold text-slate-400">Alt+Shift+S</kbd>{" "}
          or{" "}
          <kbd class="font-sans font-semibold text-indigo-300">{customShortcut()}</kbd>{" "}
          to toggle
        </p>
      </footer>
    </div>
  );
};

export default App;
