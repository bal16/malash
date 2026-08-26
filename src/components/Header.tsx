import { type Component } from "solid-js";

export const Header: Component<{ isActive: boolean }> = (props) => (
  <header class="flex items-center justify-between mb-4">
    <h1 class="text-lg font-bold text-slate-200">.malash Controller</h1>
    <div class="flex items-center space-x-2">
      <span class={`text-xs font-medium transition-colors ${props.isActive ? "text-emerald-400" : "text-slate-400"}`}>
        {props.isActive ? "Active" : "Inactive"}
      </span>
      <div class="relative flex items-center justify-center">
        {props.isActive && <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
        <span class={`relative inline-flex rounded-full h-3 w-3 transition-colors ${props.isActive ? "bg-emerald-500" : "bg-slate-600"}`} />
      </div>
    </div>
  </header>
);
