import { type Component } from "solid-js";
import { useExtensionState } from "./hooks/useExtensionState";
import { useCustomShortcutRecorder } from "./hooks/useCustomShortcutRecorder";
import { Header } from "./components/Header";
import { ToggleRow } from "./components/ToggleRow";
import { SpeedSlider } from "./components/SpeedSlider";
import { PauseToggle } from "./components/PauseToggle";
import { CustomShortcutEditor } from "./components/CustomShortcutEditor";
import { Footer } from "./components/Footer";

const App: Component = () => {
  const ext = useExtensionState();
  const rec = useCustomShortcutRecorder(ext.customShortcut, ext.setCustomShortcut);

  const handleReset = async () => {
    await ext.handleResetCustom();
    rec.handleResetCustom();
  };

  return (
    <div class="w-72 bg-slate-900 text-slate-100 p-4 font-sans select-none">
      <Header isActive={ext.isActive()} />
      <main class="space-y-6">
        <ToggleRow isActive={ext.isActive()} onToggle={ext.handleToggle} />
        <SpeedSlider speed={ext.scrollSpeed()} onInput={ext.handleSpeedChange} />
        <PauseToggle enabled={ext.pauseOnMouseMove()} onToggle={ext.handlePauseOnMoveToggle} />
        <CustomShortcutEditor
          customShortcut={ext.customShortcut()}
          isRecording={rec.isRecording()}
          pending={rec.pending()}
          pendingError={rec.pendingError()}
          saveFlash={rec.saveFlash()}
          onChange={() => rec.setIsRecording(true)}
          onReset={handleReset}
          onSave={rec.handleSaveCustom}
          onCancel={rec.handleCancelRecording}
        />
      </main>
      <Footer customShortcut={ext.customShortcut()} />
    </div>
  );
};

export default App;
