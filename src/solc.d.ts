declare module "solc" {
  const solc: {
    version(): string;
    compile(input: string, options?: { import?: (path: string) => { contents?: string; error?: string } }): string;
  };
  export default solc;
}

declare module "solc/wrapper" {
  const wrapper: (soljson: unknown) => {
    version(): string;
    compile(input: string, options?: { import?: (path: string) => { contents?: string; error?: string } }): string;
  };
  export default wrapper;
}

declare module "solc/soljson.js?url" {
  const url: string;
  export default url;
}
