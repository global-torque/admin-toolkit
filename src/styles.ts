/**
 * JavaScript URL facade for the optional reference stylesheet.
 *
 * CSS-aware tools resolve the `style` or `default` export condition directly
 * to `styles.css`; JavaScript and TypeScript consumers receive this stable URL.
 *
 * @packageDocumentation
 */

/** URL of the optional admin-toolkit reference stylesheet. @public */
export const stylesheet = new URL('./styles.css', import.meta.url).href;

export default stylesheet;
