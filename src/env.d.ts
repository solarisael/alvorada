/// <reference types="astro/client" />

// `astro check` cannot use the TypeScript 7 API yet, so `tsc` checks the .ts
// files alone and needs to know an .astro import is a component.
declare module "*.astro" {
  const component: (props: Record<string, unknown>) => unknown;
  export default component;
}
