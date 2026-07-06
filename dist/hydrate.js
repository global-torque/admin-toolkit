export function hydrate(root, options = {}) {
    if (!options.alpine?.initTree) {
        return false;
    }
    options.alpine.initTree(root);
    return true;
}
export function registerHtmxHydration(htmx, alpine) {
    htmx.onLoad((root) => {
        hydrate(root, { alpine });
    });
}
//# sourceMappingURL=hydrate.js.map