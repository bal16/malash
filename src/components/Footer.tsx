import { type Component } from "solid-js";

export const Footer: Component<{ customShortcut: string }> = (props) => (
  <footer class="mt-6 pt-4 border-t border-slate-700/50">
    <p class="text-center text-xs text-slate-500">
      Press <kbd class="font-sans font-semibold text-slate-400">Alt+Shift+S</kbd> or{" "}
      <kbd class="font-sans font-semibold text-indigo-300">{props.customShortcut}</kbd> to toggle
    </p>
  </footer>
);
