declare module "*?raw" {
  const content: string;
  export default content;
}

declare module "*.png?inline" {
  const dataUrl: string;
  export default dataUrl;
}
