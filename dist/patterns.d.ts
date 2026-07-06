export type AdminPatternState = 'default' | 'hover' | 'focus' | 'disabled' | 'loading' | 'error' | 'warning' | 'success' | 'empty';
export interface AdminHtmlPattern {
    id: string;
    name: string;
    requiredAttributes: readonly string[];
    regions: readonly string[];
    aria: readonly string[];
    states: readonly AdminPatternState[];
    darkMode: string;
    djangoExample: string;
}
export declare const adminHtmlPatterns: readonly [{
    readonly id: "alert";
    readonly name: "Alert";
    readonly requiredAttributes: readonly ["role=\"status\" or role=\"alert\"", "data-variant"];
    readonly regions: readonly ["icon", "title", "message", "actions"];
    readonly aria: readonly ["Use role=\"alert\" only for urgent errors.", "Action buttons need visible labels."];
    readonly states: readonly ["default", "error", "success", "loading"];
    readonly darkMode: "Use token variables for surface, border, and text color.";
    readonly djangoExample: "<div class=\"gt-alert\" role=\"status\" data-variant=\"{{ variant }}\">{{ message }}</div>";
}, {
    readonly id: "badge";
    readonly name: "Badge";
    readonly requiredAttributes: readonly ["data-tone"];
    readonly regions: readonly ["label", "optional icon"];
    readonly aria: readonly ["Use text that does not rely on color alone."];
    readonly states: readonly ["default", "success", "error"];
    readonly darkMode: "Use semantic foreground/background token pairs.";
    readonly djangoExample: "<span class=\"gt-badge\" data-tone=\"{{ status }}\">{{ status_label }}</span>";
}, {
    readonly id: "button";
    readonly name: "Button";
    readonly requiredAttributes: readonly ["type", "data-variant"];
    readonly regions: readonly ["icon", "label"];
    readonly aria: readonly ["Loading buttons set aria-busy=\"true\".", "Icon-only buttons require aria-label."];
    readonly states: readonly ["default", "hover", "focus", "disabled", "loading"];
    readonly darkMode: "Keep focus rings visible against dark surfaces.";
    readonly djangoExample: "<button class=\"gt-button\" type=\"submit\" data-variant=\"primary\">{{ label }}</button>";
}, {
    readonly id: "card";
    readonly name: "Card";
    readonly requiredAttributes: readonly ["data-density"];
    readonly regions: readonly ["header", "body", "footer"];
    readonly aria: readonly ["Use section/article only when the card is meaningful as a landmark."];
    readonly states: readonly ["default", "loading", "empty"];
    readonly darkMode: "Use surface and border tokens; do not bake product colors.";
    readonly djangoExample: "<section class=\"gt-card\" data-density=\"compact\"><h2>{{ title }}</h2>{{ body }}</section>";
}, {
    readonly id: "empty-state";
    readonly name: "Empty State";
    readonly requiredAttributes: readonly ["data-size"];
    readonly regions: readonly ["icon", "title", "message", "primary action"];
    readonly aria: readonly ["If loaded asynchronously, pair with aria-live on the parent region."];
    readonly states: readonly ["empty"];
    readonly darkMode: "Use muted text and border tokens.";
    readonly djangoExample: "<div class=\"gt-empty\" data-size=\"md\"><h2>{{ title }}</h2><p>{{ message }}</p></div>";
}, {
    readonly id: "progress";
    readonly name: "Progress";
    readonly requiredAttributes: readonly ["role=\"progressbar\"", "aria-valuenow", "aria-valuemin", "aria-valuemax"];
    readonly regions: readonly ["track", "bar", "label"];
    readonly aria: readonly ["Include aria-valuetext when percent alone is ambiguous."];
    readonly states: readonly ["default", "loading", "success", "error"];
    readonly darkMode: "Track and bar colors use semantic token variables.";
    readonly djangoExample: "<div class=\"gt-progress\" role=\"progressbar\" aria-valuenow=\"{{ value }}\" aria-valuemin=\"0\" aria-valuemax=\"100\"></div>";
}, {
    readonly id: "status-indicator";
    readonly name: "Status Indicator";
    readonly requiredAttributes: readonly ["data-status"];
    readonly regions: readonly ["dot", "label"];
    readonly aria: readonly ["Status text must be present for screen readers and visual users."];
    readonly states: readonly ["default", "success", "warning", "error"];
    readonly darkMode: "Use tone tokens with sufficient contrast.";
    readonly djangoExample: "<span class=\"gt-status\" data-status=\"{{ status }}\"><span aria-hidden=\"true\"></span>{{ label }}</span>";
}, {
    readonly id: "table";
    readonly name: "Table";
    readonly requiredAttributes: readonly ["scope on header cells"];
    readonly regions: readonly ["caption", "thead", "tbody", "pagination", "empty row"];
    readonly aria: readonly ["Use caption or aria-label for table purpose.", "Sortable headers expose aria-sort."];
    readonly states: readonly ["default", "loading", "empty", "error"];
    readonly darkMode: "Header, row hover, border, and zebra states use token variables.";
    readonly djangoExample: "<table class=\"gt-table\"><caption>{{ caption }}</caption><thead>{{ headers }}</thead><tbody>{{ rows }}</tbody></table>";
}, {
    readonly id: "tabs";
    readonly name: "Tabs";
    readonly requiredAttributes: readonly ["role=\"tablist\"", "role=\"tab\"", "role=\"tabpanel\""];
    readonly regions: readonly ["tab list", "tab trigger", "panel"];
    readonly aria: readonly ["Selected tabs set aria-selected=\"true\" and aria-controls."];
    readonly states: readonly ["default", "focus", "disabled"];
    readonly darkMode: "Selected and focus states use accent and border tokens.";
    readonly djangoExample: "<div class=\"gt-tabs\" role=\"tablist\">{{ tab_buttons }}</div>{{ tab_panels }}";
}, {
    readonly id: "toast";
    readonly name: "Toast";
    readonly requiredAttributes: readonly ["role=\"status\" or role=\"alert\"", "data-tone"];
    readonly regions: readonly ["title", "message", "dismiss"];
    readonly aria: readonly ["Non-urgent toast regions use role=\"status\"; destructive failures use role=\"alert\"."];
    readonly states: readonly ["default", "success", "error"];
    readonly darkMode: "Surface and border tokens must avoid CSS collisions with Django Unfold.";
    readonly djangoExample: "<div class=\"gt-toast\" role=\"status\" data-tone=\"{{ tone }}\">{{ message }}</div>";
}, {
    readonly id: "modal";
    readonly name: "Modal";
    readonly requiredAttributes: readonly ["role=\"dialog\"", "aria-modal=\"true\"", "aria-labelledby"];
    readonly regions: readonly ["header", "body", "footer", "close control"];
    readonly aria: readonly ["Focus moves into the dialog and returns to trigger on close."];
    readonly states: readonly ["default", "loading", "error"];
    readonly darkMode: "Overlay, surface, and focus tokens must be configurable.";
    readonly djangoExample: "<div class=\"gt-modal\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"{{ title_id }}\">{{ body }}</div>";
}];
export type AdminHtmlPatternId = typeof adminHtmlPatterns[number]['id'];
export declare function getAdminHtmlPattern(id: AdminHtmlPatternId): AdminHtmlPattern;
//# sourceMappingURL=patterns.d.ts.map