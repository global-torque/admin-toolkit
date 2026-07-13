declare module 'alpinejs' {
  const Alpine: {
    data(name: string, factory: (...params: unknown[]) => object): void;
    initTree(root: Element): void;
    destroyTree(root: Element): void;
  };
  export default Alpine;
}
