# TypeScript Declaration Files

### Question fee6b456-901d-4ee0-b6b2-6e87d8412c6c

- What is a `.d.ts` file and how is it treated by the compiler?

### Answer

- A declaration file contains **types only**: signatures, interfaces, ambient values — no implementations.
- It emits nothing and is never executed; it exists so other files can be type-checked against a runtime whose code lives elsewhere.
- Any file ending in `.d.ts` is excluded from emit automatically, and statements in it must not have bodies (except ambient ones).

```ts
// math.d.ts
export function add(a: number, b: number): number;
```

- [More detail on Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)
- [More detail on .d.ts files](https://www.typescriptlang.org/docs/handbook/2/type-declarations.html)

---

### Question 1554ad47-7a7f-445f-8290-acdda19c91fc

- How do library authors generate `.d.ts` files?

### Answer

- Set `declaration: true` in `tsconfig.json`; `tsc` emits a `.d.ts` next to each JS output.
- `declarationMap: true` adds source maps so "go to definition" lands in the original `.ts`.
- `emitDeclarationOnly: true` produces types without JS (used with a separate bundler for JS).

```jsonc
{ "compilerOptions": { "declaration": true, "declarationMap": true } }
```

- [More detail on declaration emit](https://www.typescriptlang.org/docs/handbook/declaration-files/dts-from-js.html)
- [More detail on declaration](https://www.typescriptlang.org/tsconfig#declaration)

---

### Question bdc7d60c-1a08-4936-b93e-21828d95dc0b

- What is DefinitelyTyped and how do `@types` packages get resolved?

### Answer

- DefinitelyTyped is the community repository of type packages published as `@types/<pkg>`.
- TS auto-includes every `@types/*` in `node_modules/@types` unless the `types` compiler option restricts it.
- `typeRoots` changes where TS looks; `types: []` disables automatic inclusion entirely.

```jsonc
{ "compilerOptions": { "types": ["node", "jest"] } }
```

- [More detail on @types](https://www.typescriptlang.org/docs/handbook/2/type-declarations.html)
- [More detail on types option](https://www.typescriptlang.org/tsconfig#types)

---

### Question 4716fe5f-5b07-45f2-b9de-709d87b7ce77

- What does `skipLibCheck` actually skip, and what is the risk?

### Answer

- It skips **type checking of all `.d.ts` files**, including your own and dependencies'.
- Speed benefit is large; the risk is missing conflicting declaration merges or broken types inside libraries (they still work for your code until you rely on the broken part).
- It does not skip files with implementations; it is not a correctness switch for your own code.

- [More detail on skipLibCheck](https://www.typescriptlang.org/tsconfig#skipLibCheck)
- [More detail on declaration files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)

---

### Question 15c04faf-8e87-421d-89e2-6f4b484ff49a

- When does a `.d.ts` file create global types, and how do you stop it?

### Answer

- A `.d.ts` **without** any top-level `import`/`export` is a script, so its declarations are global.
- Adding `export {}` (or any import/export) turns it into a module, scoping declarations to imports.
- If you want a global augmentation from a module file, wrap the declarations in `declare global { ... }`.

```ts
// globals.d.ts (script → globals)
interface AppConfig { apiUrl: string }
export {}; // uncomment to scope it to this module
```

- [More detail on global .d.ts](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-d-ts.html)
- [More detail on global augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#global-augmentation)

---

### Question 7f220fbb-5643-4f0c-a5ae-0a1a5d053da0

- How do you declare types for a library with no types at all?

### Answer

- Create a `.d.ts` (often `types/legacy.d.ts`) with `declare module "legacy-lib" { ... }`.
- Export only what you use; ambient module declarations merge, so you can extend later.
- Better long-term: install `@types/legacy-lib` if it exists, or contribute types upstream.

```ts
declare module "legacy-lib" {
  export function run(cmd: string): Promise<number>;
}
```

- [More detail on ambient modules](https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html)
- [More detail on module declarations](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-d-ts.html)

---

### Question abefa898-f692-475a-9abf-4bcd70842769

- What are triple-slash directives and when are they still needed?

### Answer

- Special comments that instruct the compiler: `/// <reference types="node" />`, `/// <reference lib="dom" />`, `/// <reference path="./x.d.ts" />`.
- They are a pre-module mechanism; most needs are covered by `import`s, `types`, and `lib` today.
- They remain common in hand-written global `.d.ts` files and in generated declaration bundles (e.g. `.d.ts` rollups).

```ts
/// <reference types="node" />
```

- [More detail on triple-slash directives](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html)
- [More detail on declaration files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)

---

### Question e7888921-3d42-4230-b012-68f438728af8

- How do you type a module that only exists as a global variable (UMD library)?

### Answer

- Ship a `.d.ts` with an `export as namespace LibName;` statement plus normal exports; the compiler then exposes a global for script consumers.
- For global-only libraries, use `declare namespace LibName` in a global `.d.ts`.
- Modern bundler consumers use the module form; the global form is for script tags.

```ts
export as namespace MyLib;
export function run(): void;
```

- [More detail on UMD globals](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-modifying-module-d-ts.html)
- [More detail on ambient namespaces](https://www.typescriptlang.org/docs/handbook/namespaces.html#ambient-namespaces)

---

### Question 518c199d-c8eb-4e1c-bc9d-d9cae93dbbc3

- How do you declare global variables injected by the environment (env vars, build flags)?

### Answer

- Use `declare const`/`declare var` in a global `.d.ts`, or `declare global` from a module file.
- For env objects, augment existing interfaces (`ProcessEnv`, `ImportMetaEnv`, `Window`) rather than redeclaring them.
- Keep them in one file so ownership and types stay obvious.

```ts
declare const __BUILD_ID__: string;
declare namespace NodeJS { interface ProcessEnv { API_URL: string } }
```

- [More detail on ambient declarations](https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html)
- [More detail on global augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#global-augmentation)

---

### Question 06a07804-9d56-49ce-838c-a39cfb9110d8

- What is the difference between `declare var`, `declare const`, and `declare let`?

### Answer

- `declare const`/`let`/`var` describe an existing binding; the compiler emits nothing.
- `const` forbids reassignment; `var`/`let` allow it; none create values.
- `declare const` is the most common for injected constants; use `declare var` when the global is mutable.

```ts
declare var featureFlags: Record<string, boolean>;
featureFlags = {};
```

- [More detail on ambient variables](https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html)
- [More detail on declare](https://www.typescriptlang.org/docs/handbook/2/basic-types.html)

---

### Question 72396b32-7d50-4e32-ac22-d05a24418284

- How do you publish a package's types correctly?

### Answer

- Set the top-level `"types"` field, or better, a `"types"` condition inside `exports` **listed before** `import`/`require`.
- Keep declaration files in the published `files` array and avoid `paths`-dependent imports in `.d.ts` output.
- Test with `arethetypeswrong` and a consumer-style smoke test (`tsd` or a small package).

```jsonc
{ "types": "./dist/index.d.ts", "files": ["dist"] }
```

- [More detail on publishing](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html)
- [More detail on package exports](https://www.typescriptlang.org/docs/handbook/modules/reference.html#packagejson-exports)

---

### Question abece4cf-0c7c-47d0-9dba-a3e1052e03cd

- What are `.d.mts` and `.d.cts` files for?

### Answer

- Added with Node16/NodeNext resolution: they declare types for `.mjs` and `.cjs` files respectively, matching their module format.
- A package that ships both ESM and CJS builds usually ships one declaration per format, referenced from `exports`.
- Using the wrong extension causes resolution errors in strict Node module modes.

```
dist/index.d.mts  ← for index.mjs
dist/index.d.cts  ← for index.cjs
```

- [More detail on module formats and declarations](https://www.typescriptlang.org/docs/handbook/modules/reference.html)
- [More detail on moduleResolution](https://www.typescriptlang.org/tsconfig#moduleResolution)

---

### Question 6cc0bc97-1dcd-43ad-b4dc-bf1d7e572b6a

- Why can a `.d.ts` file not contain a `const enum` that consumers rely on?

### Answer

- `const enum` members must be inlined at each use site, which requires the enum's declaration to be available for every consumer.
- Ambient const enums (in `.d.ts`) are inaccessible under `isolatedModules`, and transpile-only tools cannot inline them.
- Use a union of literal types or `as const` object in declaration files instead.

```ts
export declare enum Kind { A = "a" } // non-const enum: safe, emits a runtime object
```

- [More detail on const enums](https://www.typescriptlang.org/docs/handbook/enums.html#const-enums)
- [More detail on isolatedModules](https://www.typescriptlang.org/tsconfig#isolatedModules)

---

### Question 51d58b16-383e-4318-a2ee-8da7edadfc17

- How do you emit types from JavaScript source?

### Answer

- Enable `allowJs` + `declaration`; TS infers types from JS and JSDoc, then writes `.d.ts`.
- `checkJs: true` also type-checks the JS; without it, inference still works from explicit JSDoc and defaults.
- JSDoc tags (`@param`, `@returns`, `@typedef`) are the way to express types in JS.

```js
/** @param {string} name @returns {number} */
function len(name) { return name.length; }
```

- [More detail on declarations from JS](https://www.typescriptlang.org/docs/handbook/declaration-files/dts-from-js.html)
- [More detail on JSDoc reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)

---

### Question 6a102f57-384b-4dc0-80ac-93f5390b83cc

- What does `@ts-expect-error` do that `@ts-ignore` does not?

### Answer

- `@ts-expect-error` suppresses the next line's error **but errors if there is no error** — a self-cleaning suppression.
- `@ts-ignore` silently suppresses and hides future breakage.
- Prefer `@ts-expect-error` with a comment explaining why, and aim to delete it once the underlying issue is fixed.

```ts
// @ts-expect-error legacy runtime shape differs from types
legacyCall();
```

- [More detail on ts-expect-error](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html#ts-ignore-or-ts-expect-error)
- [More detail on ts-ignore](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html)

---

### Question 548b76a6-3ad0-4327-a47c-5112fa5182e5

- What does `typeRoots` change?

### Answer

- It sets the folders from which TS collects **global** declaration packages (`@types`-style), replacing the default `node_modules/@types` walk.
- It is rarely needed; a common footgun is setting it to `./types` and accidentally losing `@types/node`.
- `types` is usually the better control: keep default roots, list the packages to include.

- [More detail on typeRoots](https://www.typescriptlang.org/tsconfig#typeRoots)
- [More detail on types](https://www.typescriptlang.org/tsconfig#types)

---

### Question e2c0b706-e852-49f6-b464-4dd9feadb01d

- How do you declare a class-shaped runtime value in a `.d.ts`?

### Answer

- `declare class` with members and method signatures (no bodies), or an interface plus a `declare const` for the value.
- `declare class` describes both the constructor value and the instance type; `declare abstract class` blocks `new`.
- Static members go in the class body with `static`.

```ts
declare class Cache<T> {
  constructor(max: number);
  get(key: string): T | undefined;
  static version: string;
}
```

- [More detail on ambient classes](https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html)
- [More detail on declare](https://www.typescriptlang.org/docs/handbook/2/basic-types.html)

---

### Question 4a600eb3-6f9a-41ab-8a52-1b0005a0772f

- How do you type an untyped CSS module import for a Vite/Next project?

### Answer

- Add a wildcard ambient module for the extension, declaring the shape the bundler provides.
- Vite's `vite/client` types already cover CSS/asset imports; install/reference those instead of hand-rolling.
- Next.js provides `next-env.d.ts`; do not overwrite it, extend with your own file if needed.

```ts
declare module "*.css" {
  const classes: Record<string, string>;
  export default classes;
}
```

- [More detail on wildcard modules](https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html)
- [More detail on Vite client types](https://vitejs.dev/guide/features.html#client-types)

---

### Question dd31b986-40c2-454e-b0ac-b4afc4619aea

- Why is `noEmit` incompatible with `emitDeclarationOnly`?

### Answer

- `noEmit` means "produce no output at all"; `emitDeclarationOnly` means "produce only `.d.ts`".
- They contradict, so TS reports a configuration error.
- Use `emitDeclarationOnly` alone, or `noEmit` with `tsc --noEmit` for checking in CI.

- [More detail on noEmit](https://www.typescriptlang.org/tsconfig#noEmit)
- [More detail on emitDeclarationOnly](https://www.typescriptlang.org/tsconfig#emitDeclarationOnly)

---

### Question 81592c30-b336-45b7-9c73-372254e177bb

- What is the correct way to add a property to `Window` from application code?

### Answer

- In a module file: `declare global { interface Window { __myApp?: { version: string } } }`.
- In a global `.d.ts`: declare `interface Window { ... }` directly (interface merging with the DOM declaration).
- Use optional properties when the value only exists after runtime setup, and prefer a typed module export for new code.

```ts
declare global { interface Window { __myApp?: { version: string } } }
export {};
```

- [More detail on global augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#global-augmentation)
- [More detail on Window](https://developer.mozilla.org/en-US/docs/Web/API/Window)

---

### Question 4b317155-1c01-4a75-85b1-1462f005870c

- How should declarations handle conditional exports for CJS and ESM consumers?

### Answer

- Provide per-format declarations and map them in `exports` under `types` for each condition (`import` → `.d.mts`, `require` → `.d.cts`).
- A single `.d.ts` for both formats can mis-type default imports for one of the consumers.
- Validate with `arethetypeswrong` ("CJS/ESM/types" checks) before publishing.

```jsonc
{ "exports": { ".": { "import": { "types": "./dist/index.d.mts", "default": "./dist/index.mjs" },
                       "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" } } } }
```

- [More detail on conditional exports](https://nodejs.org/api/packages.html#conditional-exports)
- [More detail on types in exports](https://www.typescriptlang.org/docs/handbook/modules/reference.html#packagejson-exports)

---

### Question 7c3ff431-bc46-497f-9da9-5d21272d43e6

- When is a global `.d.ts` file a better choice than module augmentation?

### Answer

- When the runtime value is genuinely global (script-tag libs, injected globals) and no module owns it.
- Global files are simpler: no imports, no `declare global`, and they merge with DOM lib types directly.
- The cost is process-wide leakage — any accidental name collision becomes a build error.

- [More detail on global .d.ts templates](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-d-ts.html)
- [More detail on global augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#global-augmentation)

---

### Question 934d9eeb-30c7-48e3-b0a4-c055ab87259a

- How do you test that your declaration files are correct?

### Answer

- Write type tests with `tsd` or plain `expectType` helpers in a file compiled by `tsc --noEmit`.
- Add negative tests (`@ts-expect-error`) to verify invalid usages actually fail.
- Run `arethetypeswrong` against the packed tarball to catch resolution/module-format issues.

```ts
import { expectType } from "tsd";
import { add } from "./math";
expectType<number>(add(1, 2));
```

- [More detail on tsd](https://github.com/SamVerschueren/tsd)
- [More detail on publishing types](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html)

---

### Question 4d2c57ba-5cac-4009-8141-af1964c3c91e

- What does `declarationMap` add and when do you regret not enabling it?

### Answer

- It emits `.d.ts.map` files linking declarations back to the original source, so editors jump to real code instead of generated `.d.ts`.
- Without it, "go to definition" in a consumer project lands on a flattened declaration, often with transformed names.
- Most useful for packages authored in TS and published with declarations; costs slightly larger packages.

- [More detail on declarationMap](https://www.typescriptlang.org/tsconfig#declarationMap)
- [More detail on declaration](https://www.typescriptlang.org/tsconfig#declaration)

---

### Question 07ed975e-7cba-4180-a93a-e9815c9ec247

- How do you block a transitive `@types` package from polluting globals?

### Answer

- Use `types: []` or an explicit allow-list (`types: ["node"]`) in `tsconfig.json`.
- This stops `@types/jest`, `@types/mocha`, and similar from injecting global names you did not ask for.
- Test files then need explicit imports of their types, which is clearer anyway.

```jsonc
{ "compilerOptions": { "types": ["node"] } }
```

- [More detail on types option](https://www.typescriptlang.org/tsconfig#types)
- [More detail on typeRoots](https://www.typescriptlang.org/tsconfig#typeRoots)

---

### Question 1fffb1aa-e561-447a-bae5-43399d005030

- What is `export =` in a `.d.ts` and how do consumers import it?

### Answer

- It declares a CommonJS export: the module's value replaces the namespace object.
- Consumers write `import x = require("pkg")` or, with `esModuleInterop`, `import x from "pkg"`.
- It cannot be mixed with `export default` in the same declaration file.

```ts
declare function fn(s: string): number;
export = fn;
```

- [More detail on export =](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-export-=-d-ts.html)
- [More detail on esModuleInterop](https://www.typescriptlang.org/tsconfig#esModuleInterop)

---

### Question 302855b3-fb37-47ef-9817-dbd80e81dc13

- Why might a `.d.ts` from a dependency break your build after a minor version bump?

### Answer

- Declaration files are an API surface: a changed generic default or widened union can break inference in your code even if runtime behavior is unchanged.
- Some packages publish types via a separate `@types` version, so types and runtime versions drift.
- Pin type versions, keep `skipLibCheck` as a mitigation, and read declaration diffs when upgrading.

- [More detail on Semantic Versioning and types](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html)
- [More detail on skipLibCheck](https://www.typescriptlang.org/tsconfig#skipLibCheck)

---

### Question 062d2a88-a66d-43ac-9cb6-587fc2f579bf

- What does `// @ts-nocheck` do and when is it acceptable?

### Answer

- It disables type checking for the **entire file**, not just the next line.
- Acceptable for large generated or vendored files, and as a temporary migration marker; everywhere else it is a silent hole.
- Prefer `@ts-expect-error` at exact lines and keep a TODO/issue so the file can be re-enabled.

```ts
// @ts-nocheck
export const generated = ...;
```

- [More detail on ts-nocheck](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#-ts-nocheck-in-typescript-files)
- [More detail on ts-expect-error](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html#ts-ignore-or-ts-expect-error)

---

### Question 1faf512d-f0a9-4c79-8524-69bfb76315d1

- What happens if a `.d.ts` declares a runtime value that does not actually exist?

### Answer

- The compiler trusts the declaration, so the code compiles and then crashes at runtime with `undefined is not a function`.
- Declaration files are a **promise about runtime**; nothing verifies them.
- Keep hand-written declarations in sync with the real module, and prefer generated declarations or a smoke test that imports the value.

```ts
declare module "x" { export function missing(): void; }
import { missing } from "x";
missing(); // compiles; throws at runtime
```

- [More detail on ambient declarations](https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html)
- [More detail on type erasure](https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types)

---

### Question f2c80d67-d632-4f6f-b2a6-d38108dc8f91

- How do you type a CommonJS `require` call in a TypeScript file?

### Answer

- Use the import-equals form: `import x = require("x")`, which requires `module: commonjs` (or another CJS-emitting setting).
- It cannot coexist with `verbatimModuleSyntax` in ESM output — the compiler rejects it because ESM has no `require`.
- In ESM code, use `createRequire(import.meta.url)` and type the result, or just `import`.

```ts
import fs = require("node:fs");
fs.readFileSync("a.txt");
```

- [More detail on import = require](https://www.typescriptlang.org/docs/handbook/2/modules.html)
- [More detail on verbatimModuleSyntax](https://www.typescriptlang.org/tsconfig#verbatimModuleSyntax)
