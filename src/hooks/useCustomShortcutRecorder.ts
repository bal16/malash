import { createSignal, onCleanup, onMount } from "solid-js";
import browser from "webextension-polyfill";
import { eventToString, validateShortcut } from "../content/shortcut";

export function useCustomShortcutRecorder(
  _customShortcut: () => string,
  setCustomShortcut: (v: string) => void,
) {
  const [isRecording, setIsRecording] = createSignal(false);
  const [pending, setPending] = createSignal<string | null>(null);
  const [pendingError, setPendingError] = createSignal<string | null>(null);
  const [saveFlash, setSaveFlash] = createSignal(false);

  const handleBlurAutosave = async () => {
    if (isRecording() && pending()) {
      const v = validateShortcut(pending()!);
      if (v.ok) await browser.storage.local.set({ customShortcut: pending()! });
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

  // Register synchronously for testability
  window.addEventListener("keydown", handleRecordingKeyDown, true);
  window.addEventListener("blur", handleBlurAutosave);
  const visHandler = () => {
    if (document.visibilityState === "hidden") void handleBlurAutosave();
  };
  document.addEventListener("visibilitychange", visHandler);
  window.addEventListener("beforeunload", handleBlurAutosave);

  onMount(() => {});
  onCleanup(() => {
    window.removeEventListener("keydown", handleRecordingKeyDown, true);
    window.removeEventListener("blur", handleBlurAutosave);
    document.removeEventListener("visibilitychange", visHandler);
    window.removeEventListener("beforeunload", handleBlurAutosave);
  });

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

  const clearRecording = () => {
    setIsRecording(false);
    setPending(null);
    setPendingError(null);
  };

  const handleResetCustom = async () => {
    clearRecording();
  };

  return {
    isRecording,
    pending,
    pendingError,
    saveFlash,
    setIsRecording,
    setPending,
    setPendingError,
    handleSaveCustom,
    handleCancelRecording,
    handleResetCustom,
  };
}
