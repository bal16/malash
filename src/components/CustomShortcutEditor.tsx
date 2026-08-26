import { type Component } from "solid-js";

export const CustomShortcutEditor: Component<{
  customShortcut: string;
  isRecording: boolean;
  pending: string | null;
  pendingError: string | null;
  saveFlash: boolean;
  onChange: () => void;
  onReset: () => void;
  onSave: () => void;
  onCancel: () => void;
}> = (props) => (
  <div class="pt-4 border-t border-slate-800 space-y-2">
    <div class="flex items-center justify-between">
      <span class="font-medium text-sm text-slate-300">Custom shortcut</span>
      {props.saveFlash && <span class="text-xs text-emerald-400">Saved {props.customShortcut}</span>}
    </div>
    {!props.isRecording ? (
      <div class="flex items-center justify-between gap-2">
        <kbd class="font-mono text-xs text-indigo-300 bg-indigo-900/50 px-2 py-1 rounded border border-indigo-800">{props.customShortcut}</kbd>
        <div class="flex gap-2">
          <button onClick={props.onChange} class="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200">Change</button>
          <button onClick={props.onReset} class="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200">Reset</button>
        </div>
      </div>
    ) : (
      <div class="space-y-2">
        <p class="text-xs text-slate-400">Press new combination… Esc to cancel</p>
        {props.pending && (
          <div class="flex items-center justify-between">
            <kbd class={`font-mono text-xs px-2 py-1 rounded border ${props.pendingError ? "text-red-300 bg-red-900/30 border-red-800" : "text-emerald-300 bg-emerald-900/30 border-emerald-800"}`}>{props.pending}</kbd>
            <div class="flex gap-2">
              <button onClick={props.onSave} disabled={!!props.pendingError || !props.pending} class="text-xs px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 text-white">Save</button>
              <button onClick={props.onCancel} class="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200">Cancel</button>
            </div>
          </div>
        )}
        {props.pendingError && <p class="text-xs text-red-400">{props.pendingError}</p>}
        {!props.pending && (
          <div class="flex gap-2">
            <button onClick={props.onCancel} class="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200">Cancel</button>
          </div>
        )}
      </div>
    )}
    <p class="text-xs text-slate-500">Fallback when Alt+Shift+S is grabbed by browser. Both shortcuts stay active.</p>
  </div>
);
