# TypeScript Modules & Namespaces

### Question 7f3eeed7-1fdb-4c40-9056-8d114f75a11e

- When is a TypeScript file treated as a module rather than a script?

### Answer

- A file is a **module** if it contains a top-level `import` or `export`.
- Otherwise it is a **script**, and its top-level declarations are global — a common source of duplicate-identifier errors.
- `export {}` is the standard trick to make a file a module without exporting anything; `moduleDetection: "force"` treats all files (except `.d.ts`) as modules.

- [More detail on Modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)
- [More detail on moduleDetection](https://www.typescriptlang.org/tsconfig#moduleDetection)

---

### Question 6fe682de-8784-4648-93d2-eac61af0b2d9

- What does `import type` change compared with a regular import?

### Answer

- `import type { X } from "./x"` is guaranteed to be **erased** — it never produces a runtime import.
- It documents that the dependency is type-only and prevents accidental side-effect imports.
- Inline form: `import { type X, y } from "./mod"` mixes type-only and value imports.

```ts
import type { User } from "./types";
import { createUser, type UserId } from "./user";
```

- [More detail on type-only imports](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export)
- [More detail on verbatimModuleSyntax](https://www.typescriptlang.org/tsconfig#verbatimModuleSyntax)

---

### Question e79e15d0-e7d1-4587-9623-744afc5e2917

- What does `verbatimModuleSyntax` enforce, and why do bundlers want it?

### Answer

- Type-only imports/exports must be written with `import type`/`export type`; otherwise they are emitted as-is and could be dropped unexpectedly by tooling.
- It guarantees that TS's emit does not reorder/elide statements, so what you write is what the bundler sees.
- It also forbids `import x = require()` in ESM output, keeping one module system per file.

```ts
import { type Foo } from "./foo"; // required form for type-only members
export type { Foo };
```

- [More detail on verbatimModuleSyntax](https://www.typescriptlang.org/tsconfig#verbatimModuleSyntax)
- [More detail on isolatedModules](https://www.typescriptlang.org/tsconfig#isolatedModules)

---

### Question 1aa8eab4-0f6b-4805-9890-09b44ade7006

- Why does `isolatedModules` reject re-exporting a type without `export type`?

### Answer

- Single-file transpilers (Babel, SWC, esbuild) cannot know whether a re-exported name is a type or a value.
- `export { SomeType } from "./x"` may emit a value import that fails at runtime; `export type { SomeType }` is erased safely.
- TS reports this at compile time, which is exactly the class of bug `isolatedModules` exists to prevent.

```ts
export type { Config } from "./config"; // safe everywhere
```

- [More detail on isolatedModules](https://www.typescriptlang.org/tsconfig#isolatedModules)
- [More detail on type-only re-exports](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export)

---

### Question 2d435d90-d5b9-4d31-b6f8-afca27c19139

- How do named exports, default exports, and re-exports behave in TS?

### Answer

- Named exports are preferred: they are greppable, refactor-friendly, and re-export cleanly.
- `export default` is legal but loses the name at import sites and behaves differently across CJS/ESM interop.
- Re-export with `export { x } from "./m"` or `export * from "./m"` (which does **not** re-export the default).

```ts
export { createUser } from "./user";
export * as user from "./user"; // namespace re-export
```

- [More detail on exports](https://www.typescriptlang.org/docs/handbook/2/modules.html)
- [More detail on esModuleInterop](https://www.typescriptlang.org/tsconfig#esModuleInterop)

---

### Question 76b01160-ddb7-4349-882e-ab548bdab352

- What does `esModuleInterop` change, and why is it on by default in modern configs?

### Answer

- It enables a runtime helper so `import x from "cjs-module"` works for CommonJS modules that export via `module.exports = ...`.
- Without it, default imports from CJS error or require `import x = require(...)`/`import * as x`.
- `allowSyntheticDefaultImports` enables the types-only part; `esModuleInterop` includes both.

```ts
import express from "express"; // works with esModuleInterop
```

- [More detail on esModuleInterop](https://www.typescriptlang.org/tsconfig#esModuleInterop)
- [More detail on allowSyntheticDefaultImports](https://www.typescriptlang.org/tsconfig#allowSyntheticDefaultImports)

---

### Question 4d97f553-8414-4f27-8f83-7a6a87058c5e

- What is the difference between `moduleResolution: "node16"`/`"nodenext"` and `"bundler"`?

### Answer

- `node16`/`nodenext` model real Node resolution: ESM files need explicit `.js` extensions, `package.json` `"type"` matters, and `exports` maps are enforced.
- `bundler` mimics bundler behavior: extensionless imports, `exports` maps, and no Node-specific extension rules.
- Choose based on who resolves the output: Node (node16/nodenext) or a bundler (bundler).

```jsonc
{ "compilerOptions": { "module": "ESNext", "moduleResolution": "bundler" } }
```

- [More detail on moduleResolution](https://www.typescriptlang.org/tsconfig#moduleResolution)
- [More detail on the bundler mode](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#resolution-customization-flags)

---

### Question 4668c815-9769-4eab-bcd2-f2eb58a9ceb3

- Why must `paths` aliases be mirrored in the bundler/runtime?

### Answer

- `paths` only affects **type checking** — TS does not rewrite import specifiers in emitted JS.
- The bundler (or `tsconfig-paths`/Node loader) must resolve the same alias, or runtime resolution fails.
- Keep the alias map in one place and generate/mirror it for tools when possible.

```jsonc
{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }
```

- [More detail on paths](https://www.typescriptlang.org/tsconfig#paths)
- [More detail on baseUrl](https://www.typescriptlang.org/tsconfig#baseUrl)

---

### Question 6f87eaff-416d-40d7-9e12-f171419d12ea

- How do you type a JSON import?

### Answer

- Enable `resolveJsonModule`; TS infers a **structural type** from the file's content, keeping literal-derived shapes.
- Object types from JSON are inferred with widened property types (`string`, not literals).
- For huge or environment-specific JSON, prefer loading at runtime and validating instead of importing.

```ts
import pkg from "./package.json"; // typed object
pkg.name; // string
```

- [More detail on resolveJsonModule](https://www.typescriptlang.org/tsconfig#resolveJsonModule)
- [More detail on modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)

---

### Question e80a458c-bd97-4c4d-bc0f-fb8b4be3183e

- What are namespaces and why are they considered legacy?

### Answer

- `namespace N { export const x = 1 }` declares a named scope that **emits a runtime object** with its exports.
- They predate ES modules and remain useful for declaration merging in `.d.ts` files and global script libraries.
- In application code they conflict with modern module systems, hurt tree-shaking, and are rejected by `erasableSyntaxOnly`.

```ts
namespace Util { export const version = "1"; }
Util.version;
```

- [More detail on Namespaces](https://www.typescriptlang.org/docs/handbook/namespaces.html)
- [More detail on namespaces and modules](https://www.typescriptlang.org/docs/handbook/namespaces-and-modules.html)

---

### Question 2326b74e-7d5b-43df-ae21-cc001ab95d2b

- What can a namespace merge with, and why would that matter?

### Answer

- Namespaces merge with classes, functions, and enums (declaration merging), adding static-like members or extra types.
- This is how libraries model "function with properties" or "class with nested types".
- Merging is only meaningful for ambient/global patterns; modern code uses module exports instead.

```ts
function greeter() {}
namespace greeter { export const lang = "en"; }
greeter.lang;
```

- [More detail on Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [More detail on Namespaces](https://www.typescriptlang.org/docs/handbook/namespaces.html)

---

### Question 7de729f2-fb40-4a32-b587-c1c12f5a152d

- How do you declare an ambient module for an untyped package?

### Answer

- Create a `.d.ts` and use `declare module "pkg-name" { ... }`; no emit is produced and the module is matched by specifier.
- For wildcard assets, use `declare module "*.css"` / `"*.svg"` and export the appropriate default/value.
- Ambient modules apply when the real package has no types and is not covered by `@types`.

```ts
declare module "legacy-lib" {
  export function run(cmd: string): Promise<number>;
}
declare module "*.svg" {
  const src: string;
  export default src;
}
```

- [More detail on ambient modules](https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html)
- [More detail on module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation)

---

### Question 99d332fc-1a1a-47e9-a5a3-d98106fa9516

- What is `declare global` and when do you need it?

### Answer

- Inside a **module** file, `declare global { ... }` adds declarations to the global scope (module files do not pollute globals otherwise).
- Used for env-injected globals (`window.__APP_CONFIG`, `typeof window` extensions) and for augmenting `Window`/`ProcessEnv`.
- Global augmentation is process-wide, so keep it in one dedicated `.d.ts` to avoid duplicates and surprises.

```ts
export {};
declare global {
  interface Window { __APP_CONFIG: { apiUrl: string } }
}
```

- [More detail on global augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#global-augmentation)
- [More detail on ambient declarations](https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html)

---

### Question f6311b9b-6f18-4cec-becc-c3f7d31b662f

- Why do type-only circular imports usually not break anything?

### Answer

- `import type` is erased, so no runtime cycle exists and no partially-initialized module is observed.
- Value cycles can break at runtime depending on evaluation order (TDZ/`undefined` bindings).
- Prefer type-only cycles (models referencing each other) and break value cycles with dependency inversion or lazy `import()`.

```ts
// a.ts
import type { B } from "./b";
export interface A { b: B }
```

- [More detail on type-only imports](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export)
- [More detail on ES module cycles](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)

---

### Question 06449f80-f4a1-47a2-b34d-c880948e93f2

- How do you type a dynamic import?

### Answer

- `await import("./mod")` returns a `Promise` of the module namespace type; member access is fully typed.
- Type-only form `import("./mod").TypeName` fetches a type without any runtime import.
- Dynamic imports work with bundlers for code splitting; the specifier must be statically analyzable for bundlers to include it.

```ts
const mod = await import("./heavy");
mod.helper();
type T = import("./heavy").Thing;
```

- [More detail on dynamic imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
- [More detail on import type expressions](https://www.typescriptlang.org/docs/handbook/2/modules.html)

---

### Question c4384d2a-0dc7-4532-bb39-0e39f2ea58cb

- What is a barrel file and what are its costs?

### Answer

- `index.ts` re-exporting a folder's modules for convenient imports.
- Costs: import cycles between barrels, slower `tsc`/bundler analysis, harder tree-shaking, and accidental private-API exposure.
- Use barrels at package boundaries, not at every folder level, and prefer explicit imports inside a package.

```ts
export * from "./user";
export * from "./post";
```

- [More detail on modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)
- [More detail on performance](https://github.com/microsoft/TypeScript/wiki/Performance)

---

### Question 6a288825-c2c9-4d57-960d-e13658209c8b

- What does `export * as ns from "./mod"` produce?

### Answer

- A single named export `ns` bound to the module namespace object of `./mod`.
- It preserves the module boundary, so consumers write `ns.member`, avoiding name collisions.
- Default exports are not included in `export *`, but `export * as ns` exposes the namespace including `default`.

```ts
export * as user from "./user";
// consumer: import { user } from ".";
```

- [More detail on namespace re-exports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export)
- [More detail on modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)

---

### Question eeaf5cb4-f84f-4e28-ba94-2759e7d1ab7b

- How does `export =` work and when do you encounter it?

### Answer

- `export =` models CommonJS `module.exports = value`; consumers import it with `import x = require("x")` or a default import under `esModuleInterop`.
- You meet it in `.d.ts` files of CJS packages (older Express, lodash) and when authoring types for a CJS module.
- It cannot be combined with ES module exports in the same file.

```ts
declare function f(s: string): number;
export = f;
```

- [More detail on export =](https://www.typescriptlang.org/docs/handbook/2/modules.html)
- [More detail on esModuleInterop](https://www.typescriptlang.org/tsconfig#esModuleInterop)

---

### Question c183266c-b8a5-47e4-8d5e-82dba973ca6b

- What is a package `exports` map and how do types fit into it?

### Answer

- `package.json` `exports` defines which subpaths are importable, per condition (`import`, `require`, `types`).
- The `"types"` condition should be listed **first** in each entry; otherwise bundlers/TS may resolve `import` first and find no types.
- Legacy consumers use `typesVersions`/top-level `types`; modern packages ship both.

```jsonc
{ "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } } }
```

- [More detail on exports and types](https://www.typescriptlang.org/docs/handbook/modules/reference.html#packagejson-exports)
- [More detail on publishing types](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html)

---

### Question 55fd1da2-77f0-4d40-8bc6-4c995047030c

- Why do ESM + Node projects need `.js` extensions in relative imports even though the file is `.ts`?

### Answer

- Node ESM resolves the **emitted** filename, which is `.js` after compilation.
- With `moduleResolution: node16/nodenext`, TS requires you to write the emitted specifier (`./user.js`), and it maps back to `./user.ts` for types.
- Bundler mode relaxes this, which is why the rule seems inconsistent across projects.

```ts
import { user } from "./user.js"; // file on disk: user.ts
```

- [More detail on relative import extensions](https://www.typescriptlang.org/docs/handbook/modules/reference.html)
- [More detail on moduleResolution](https://www.typescriptlang.org/tsconfig#moduleResolution)

---

### Question 6877ed8d-5259-42b5-9693-e2dc9735f0c9

- What does `module: "preserve"` (TS 5.4) do?

### Answer

- It keeps `import`/`require` syntax as written and enables `moduleResolution: "bundler"` — designed for code that is always processed by a bundler or transpiler afterwards.
- It avoids rewriting ESM to CJS and is the modern choice for bundler-first projects that still emit `import` statements.
- Use `nodenext` when Node itself runs the output.

- [More detail on module preserve](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-4.html)
- [More detail on module](https://www.typescriptlang.org/tsconfig#module)

---

### Question 07d0dec0-6225-42e5-a37d-f973caa7ec88

- How do you type a side-effect-only import?

### Answer

- `import "./polyfills"` has no bindings; TS still resolves and type-checks the module (and its declarations) if present.
- With `verbatimModuleSyntax`, side-effect imports are preserved untouched — important for CSS and initialization order.
- If the module has no types, add a wildcard ambient module so the import does not error.

```ts
import "./styles.css";
```

- [More detail on side-effect imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)
- [More detail on verbatimModuleSyntax](https://www.typescriptlang.org/tsconfig#verbatimModuleSyntax)

---

### Question bdb2a00f-f6ef-4d1b-8e9d-6a68ada6b5eb

- What is the difference between a `namespace` and a `.d.ts` module declaration?

### Answer

- `namespace` introduces a runtime namespace object (unless `declare`d).
- `declare namespace` is **type-only** and describes an existing global object, typical for UMD/global libs.
- `declare module` describes a module specifier's shape; it does not create a global.

- [More detail on ambient namespaces](https://www.typescriptlang.org/docs/handbook/namespaces.html#ambient-namespaces)
- [More detail on declaration files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)

---

### Question 8188000b-a346-400d-8d61-883a40155a04

- Why can duplicate global declarations from two packages cause build failures, and how do you avoid it?

### Answer

- Two `@types` packages can augment the same global interface with conflicting member types, and TS reports "subsequent property declarations must have the same type".
- `skipLibCheck` hides these errors between declaration files, which is why many projects enable it.
- Avoid adding global augmentation in application code; scope types to modules and augment only what you truly need.

- [More detail on declaration merging conflicts](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [More detail on skipLibCheck](https://www.typescriptlang.org/tsconfig#skipLibCheck)

---

### Question 004abadf-05a2-4c6d-ad7c-b52b0e727e58

- How do you import a type without creating a dependency edge in the emitted output?

### Answer

- `import type`/`export type` are erased, so no runtime dependency is created.
- This matters for `import type` of a dev-only package (test utilities, type helpers) — it can stay a devDependency.
- Beware: a value import used only in type positions may still be emitted unless TS can prove erasure; `verbatimModuleSyntax` makes the distinction explicit.

- [More detail on type-only imports](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export)
- [More detail on verbatimModuleSyntax](https://www.typescriptlang.org/tsconfig#verbatimModuleSyntax)

---

### Question fdf111ff-2610-4c9b-84db-34d80915cc4c

- What is a module augmentation and how does it differ from redeclaring a module?

### Answer

- Augmentation uses `declare module "pkg" { ... }` **inside a module file** and merges with the existing types.
- Redeclaring in a `.d.ts` that is not a module **replaces** the module type; both look similar but behave differently.
- Augmentation requires the target module to be resolvable (installed), otherwise you accidentally declare an ambient module.

```ts
import "express";
declare module "express-serve-static-core" {
  interface Request { user?: { id: string } }
}
```

- [More detail on module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation)
- [More detail on ambient modules](https://www.typescriptlang.org/docs/handbook/declaration-files/by-example.html)

---

### Question bf109815-d245-4c8b-b545-d1fd13b86181

- How do you make a `namespace` usable from a modern module without importing it?

### Answer

- Declare it `declare global` inside a module, or use a plain global script `.d.ts` with `declare namespace`.
- Then reference it directly (`MyLib.thing`) — no import statement exists because there is no module.
- This is a legacy pattern; prefer real modules unless you are typing a script-tag global.

```ts
declare global { namespace MyLib { const version: string } }
```

- [More detail on global augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#global-augmentation)
- [More detail on ambient namespaces](https://www.typescriptlang.org/docs/handbook/namespaces.html#ambient-namespaces)

---

### Question f3d7b2c1-a83a-403d-94ca-0accf3d4dbf4

- What is `esModuleInterop`'s relationship to `isolatedModules`?

### Answer

- They are independent: `esModuleInterop` changes **emit/interop helpers**, `isolatedModules` enforces per-file transpilability.
- Bundler-based setups typically want both plus `verbatimModuleSyntax` for predictable module syntax.
- `esModuleInterop` cannot fix a file that mixes `export =` with ES exports — that is a module-system mismatch.

- [More detail on esModuleInterop](https://www.typescriptlang.org/tsconfig#esModuleInterop)
- [More detail on isolatedModules](https://www.typescriptlang.org/tsconfig#isolatedModules)

---

### Question 749cd001-d8eb-492a-b2a2-d7bd38e5a26f

- How do you avoid a barrel-induced circular import at the type level?

### Answer

- Import from the concrete module path instead of the folder `index.ts` inside the same package.
- Use `import type` so the cycle, if any, disappears at runtime.
- If a genuine value cycle exists, invert with an interface (dependency injection) or a lazy dynamic import.

```ts
import type { User } from "./user/user"; // not "./user/index"
```

- [More detail on type-only imports](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export)
- [More detail on modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)

---

### Question 16e26743-be8f-454d-ac8f-62ada515d4d3

- What does `import.meta` give you in TS, and how do you type it?

### Answer

- `import.meta` is only available in modules; `import.meta.url` is typed as `string` by default.
- Custom properties (e.g. `import.meta.env`) must be declared by augmenting `ImportMeta` in a `.d.ts`.
- Vite/Next provide their own `ImportMetaEnv` declarations, so check before writing your own.

```ts
interface ImportMetaEnv { readonly API_URL: string }
interface ImportMeta { readonly env: ImportMetaEnv }
```

- [More detail on import.meta](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import.meta)
- [More detail on module augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation)
