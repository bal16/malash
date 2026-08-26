import { type Component } from "solid-js";

export const PauseToggle: Component<{ enabled: boolean; onToggle: () => void }> = (props) => (
  <div class="flex items-center justify-between pt-4 border-t border-slate-800">
    <span class="font-medium text-sm text-slate-300">Pause on mouse movement</span>
    <button
      onClick={props.onToggle}
      class={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${props.enabled ? "bg-indigo-600" : "bg-slate-700"}`}
      role="switch"
      aria-checked={props.enabled}
    >
      <span class={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-all duration-200 ease-in-out ${props.enabled ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  </div>
);
