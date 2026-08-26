import { type Component } from "solid-js";

export const SpeedSlider: Component<{ speed: number; onInput: (e: Event & { currentTarget: HTMLInputElement }) => void }> = (props) => (
  <div class="space-y-2">
    <div class="flex justify-between items-baseline">
      <label for="scroll-speed" class="font-medium text-slate-300">Scroll Speed</label>
      <span class="text-sm font-mono text-indigo-300 bg-indigo-900/50 px-2 py-0.5 rounded">{props.speed}px</span>
    </div>
    <input id="scroll-speed" type="range" min="1" max="50" step="1" value={props.speed} onInput={props.onInput} class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
  </div>
);
