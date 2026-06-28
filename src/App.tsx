import { type Component, createSignal, onCleanup, onMount } from "solid-js";
import browser from "webextension-polyfill";

/**
 * Defines the shape of our extension's state in browser.storage.local.
 * Using a TypeScript interface ensures type safety when accessing storage data.
 */
interface ExtensionState {
  isActive?: boolean;
  scrollSpeed?: number;
  pauseOnMouseMove?: boolean;
}

const App: Component = () => {
  // Create signals for our reactive UI state.
  // Default values are used as placeholders until the state is loaded from storage.
  const [isActive, setIsActive] = createSignal(false);
  const [scrollSpeed, setScrollSpeed] = createSignal(5);
  const [pauseOnMouseMove, setPauseOnMouseMove] = createSignal(true);

  /**
   * On component mount, we load the initial state from storage and set up a listener
   * to react to any changes that happen while the popup is open.
   */
  onMount(async () => {
    // Fetch initial state from browser.storage.local, providing defaults.
    const initialState: ExtensionState = await browser.storage.local.get({
      isActive: false,
      scrollSpeed: 5,
      pauseOnMouseMove: true,
    });
    setIsActive(initialState.isActive ?? false);
    setScrollSpeed(initialState.scrollSpeed ?? 5);
    setPauseOnMouseMove(initialState.pauseOnMouseMove ?? true);

    // Listen for changes from other parts of the extension (e.g., background script via hotkey).
    browser.storage.onChanged.addListener(handleStorageChange);
  });

  /**
   * It's crucial to clean up the listener when the popup is closed to prevent memory leaks.
   */
  onCleanup(() => {
    browser.storage.onChanged.removeListener(handleStorageChange);
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
      </main>

      {/* Footer */}
      <footer class="mt-6 pt-4 border-t border-slate-700/50">
        <p class="text-center text-xs text-slate-500">
          Press{" "}
          <kbd class="font-sans font-semibold text-slate-400">Alt+Shift+S</kbd>{" "}
          to toggle anywhere
        </p>
      </footer>
    </div>
  );
};

export default App;
