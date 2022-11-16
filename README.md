# Esbuild plugin to shake tree with tsyringe

This plugin is designed to shake tree (remove code unused) mainly with the lib tsyringe. Attention: Currently only works with ES Module (.mjs)

**What this plugin does:**

1. Replaces tsyringe library decorators and functions for native code; [(check what is being supported so far)](#tsyringe);
2. Remove unused functions that are in classes with created objects, that is, remove only what we feel is safe;
3. We use the RollupJS library to shake the tree and eliminate other code.
4. We rerun the steps to ensure the code is cleaner
5. We replace the file generated by the esbuild

---

### Requirements:

-   Only with ES Module files;
-   EcmaVersion: 'latest' (no option to change)
-   Works with multiple files;
-   Works with serverless;

### What we support in <span id="tsyringe">tsyringe</span>

**Decorators:**

-   `@injectable()`
-   `@inject(string)`

**Functions:**

-   `container.register(string, className)`
-   `container.registerSingleton(string, className)`

PS: Some unmapped item may break the tree shake

## Setup

Install via npm:

```
npm install esbuild-shake-tsyringe-tree --save-dev
```

-   Add the plugin to the `plugins` array in your Serverless `esbuild.config.js`:

```javascript
const esbuildShakeTsyringeTree = require('esbuild-shake-tsyringe-tree');
build({
    /* ... */
    format: 'esm',
    outputFileExtension: '.mjs',
    plugins: [esbuildShakeTsyringeTree],
});
```

All done! When building your project with esbuild it will automatically shake the tree. No extra configuration is needed.

## Contribute

Help us making this plugin better and future proof.

-   Clone the code
-   Install the dependencies with `npm install`
-   Create a feature branch `git checkout -b new_feature`
-   Lint with standard `npm run lint`
