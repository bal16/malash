import { createSignal, onCleanup, onMount } from "solid-js";
import browser from "webextension-polyfill";
import { DEFAULT_SHORTCUT } from "../content/shortcut";

export interface ExtensionState {
  isActive?: boolean;
  scrollSpeed?: number;
  pauseOnMouseMove?: boolean;
  customShortcut?: string;
}

export function useExtensionState() {
  const [isActive, setIsActive] = createSignal(false);
  const [scrollSpeed, setScrollSpeed] = createSignal(5);
  const [pauseOnMouseMove, setPauseOnMouseMove] = createSignal(true);
  const [customShortcut, setCustomShortcut] = createSignal(DEFAULT_SHORTCUT);

  const handleStorageChange = (
    changes: { [key: string]: browser.Storage.StorageChange },
    areaName: string,
  ) => {
    if (areaName !== "local") return;
    if (changes.isActive) setIsActive(changes.isActive.newValue as boolean);
    if (changes.scrollSpeed) setScrollSpeed(changes.scrollSpeed.newValue as number);
    if (changes.pauseOnMouseMove) setPauseOnMouseMove(changes.pauseOnMouseMove.newValue as boolean);
    if (changes.customShortcut) setCustomShortcut(changes.customShortcut.newValue as string);
  };

  // Register listener synchronously for testability; initial load async
  browser.storage.onChanged.addListener(handleStorageChange);
  void (async () => {
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
  })();

  // Keep onMount for lifecycle parity (no extra work)
  onMount(() => {});
  onCleanup(() => {
    browser.storage.onChanged.removeListener(handleStorageChange);
  });

  const handleToggle = async () => {
    const v = !isActive();
    setIsActive(v);
    await browser.storage.local.set({ isActive: v });
  };

  const handleSpeedChange = async (e: Event & { currentTarget: HTMLInputElement }) => {
    const v = e.currentTarget.valueAsNumber;
    setScrollSpeed(v);
    await browser.storage.local.set({ scrollSpeed: v });
  };

  const handlePauseOnMoveToggle = async () => {
    const v = !pauseOnMouseMove();
    setPauseOnMouseMove(v);
    await browser.storage.local.set({ pauseOnMouseMove: v });
  };

  const handleResetCustom = async () => {
    await browser.storage.local.set({ customShortcut: DEFAULT_SHORTCUT });
    setCustomShortcut(DEFAULT_SHORTCUT);
  };

  return {
    isActive,
    scrollSpeed,
    pauseOnMouseMove,
    customShortcut,
    setCustomShortcut,
    handleToggle,
    handleSpeedChange,
    handlePauseOnMoveToggle,
    handleResetCustom,
  };
}
