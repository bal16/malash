# .malash

[![SolidJS](https://img.shields.io/badge/SolidJS-1.9.13-4B7BEC?style=for-the-badge&logo=solid&logoColor=white)](https://www.solidjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-1.6-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)

**.malash** is a browser extension designed for smooth, hands-free web autoscrolling with custom shortcut remapping support.

## Features

- **Hands-Free Autoscroll:** Automatically scroll web pages with smooth controls.
- **Custom Shortcut Remapping:** Remap toggle shortcuts directly from the popup interface with auto-save support.
- **Cross-Browser Support:** Works on Chromium-based browsers (Chrome, Edge, Brave) and Firefox.
- **Background Sync:** Seamlessly synchronizes shortcut preferences across all open tabs.

## Tech Stack

- **Framework:** [SolidJS](https://www.solidjs.com/)
- **Bundler:** [Vite](https://vitejs.dev/) with `vite-plugin-web-extension` & `vite-plugin-solid`
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **API Polyfill:** `webextension-polyfill`
- **Testing:** [Vitest](https://vitest.dev/) with `jsdom`

## Getting Started

### Prerequisites

Ensure you have Node.js and pnpm or npm installed.

### Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/bal16/malash.git
   cd malash
   ```

2. Install dependencies:

   ```Bash
   pnpm install //or npm install
   ```

### Development & Build Scripts

- Development Server:

  ```Bash
  pnpm run dev
  ```

- Build Extension:

```Bash
  pnpm run build
```

- Preview Build:

```Bash
pnpm run preview
```

- Run Tests:

```Bash
pnpm run test
```

### Loading the Extension in Browser

1. Run bun run build.
2. Open your browser's extension management page:
   Chrome/Brave/Edge: Go to chrome://extensions/ and enable Developer mode.
   Firefox: Go to about:debugging#/runtime/this-firefox.

3. Click Load unpacked (or Load Temporary Add-on) and select the generated dist folder.
4. Or download signed from [release page](https://github.com/bal16/malash/releases)
