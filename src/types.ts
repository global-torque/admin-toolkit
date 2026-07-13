/** Version of the public admin-pattern schema. @public */
export type AdminPatternSchemaVersion = '0.2.0';

/** Stable identifiers for built-in HTML patterns. @public */
export type AdminHtmlPatternId =
  | 'alert'
  | 'badge'
  | 'button'
  | 'card'
  | 'empty-state'
  | 'modal'
  | 'progress'
  | 'status-indicator'
  | 'table'
  | 'tabs'
  | 'toast';

/** Generic behavior identifiers referenced by pattern fixtures. @public */
export type AdminBehaviorId =
  'dialog' | 'disclosure' | 'dismissible' | 'tabs' | 'toast-stack';

/** Neutral design-token CSS variable reference. @public */
export type AdminTokenReference = `--gt-${string}`;

/** One required element in an HTML pattern. @public */
export interface AdminPatternElement {
  /** Region identifier implemented by this element. */
  readonly region: string;
  /** Selector evaluated relative to the fixture container. */
  readonly selector: string;
  /** Required lowercase HTML tag name for every match. */
  readonly tagName: string;
  /**
   * Optional repeated-item selector. When present, cardinality is evaluated
   * independently inside every matching scope instead of across the fixture.
   */
  readonly scopeSelector?: string;
  /** Minimum number of matching elements required by the example contract. */
  readonly minimumMatches?: number;
  /** Maximum matches, when the region is cardinality-bounded. */
  readonly maximumMatches?: number;
}

/** One attribute required on a fixture element. @public */
export interface AdminPatternAttribute {
  /** Selector whose matches must carry the attribute. */
  readonly selector: string;
  /** Required HTML attribute name. */
  readonly name: string;
  /** Exact required value, when the value is fixed. */
  readonly value?: string;
  /** Finite accepted values, when more than one value is valid. */
  readonly allowedValues?: readonly string[];
  /** Anchored regular-expression source for parameterized values. */
  readonly valuePattern?: string;
  /** Minimum number of elements on which the attribute must occur. */
  readonly minimumMatches?: number;
  /** Maximum number of elements on which the attribute may occur. */
  readonly maximumMatches?: number;
}

/** Named content region exposed to a server-rendered host. @public */
export interface AdminPatternRegion {
  /** Stable host-facing region identifier. */
  readonly id: string;
  /** Selector evaluated relative to the fixture container. */
  readonly selector: string;
  /** Whether a host must render at least one region instance. */
  readonly required: boolean;
  /** Explicit minimum cardinality; defaults to one when required, else zero. */
  readonly minimumMatches?: number;
  /** Maximum matches, when the region is cardinality-bounded. */
  readonly maximumMatches?: number;
}

/** ID-reference relationship that every rendered fixture must satisfy. @public */
export interface AdminPatternIdReference {
  /** Elements carrying the IDREF attribute. */
  readonly sourceSelector: string;
  /** IDREF or IDREF-list attribute to resolve. */
  readonly attribute:
    'aria-controls' | 'aria-describedby' | 'aria-labelledby' | 'for';
  /** Selector every referenced target must match. */
  readonly targetSelector: string;
  /** Whether two source elements are forbidden from naming the same target. */
  readonly uniqueTargets?: boolean;
  /**
   * Attribute on each target that must reference the source element's ID.
   * This models reciprocal relationships such as tab/panel ownership.
   */
  readonly reciprocalAttribute?:
    'aria-controls' | 'aria-describedby' | 'aria-labelledby' | 'for';
  /**
   * Whether the relationship must be one-to-one and onto: every source names
   * exactly one target and every matching target is named exactly once.
   */
  readonly bijective?: boolean;
}

/** Supported visual or async state. @public */
export interface AdminPatternState {
  /** Stable state identifier. */
  readonly id: string;
  /** Illustrative attribute or attribute/value pair representing the state. */
  readonly attribute?: string;
}

/** Keyboard command promised by a pattern. @public */
export interface AdminKeyboardRule {
  /** Keyboard key or chord. */
  readonly key: string;
  /** Observable action promised by the fixture. */
  readonly action: string;
  /** Region or control that receives the command. */
  readonly target: string;
}

/** Focus behavior promised by an interactive pattern. @public */
export interface AdminFocusRules {
  /** Initial focus destination or explicit absence of managed focus. */
  readonly initial: string;
  /** Whether focus is contained within the pattern while active. */
  readonly trap: boolean;
  /** Whether closing restores focus to the invoking control. */
  readonly returnToTrigger: boolean;
}

/** Versioned, complete contract for one neutral server-rendered pattern. @public */
export interface AdminHtmlPattern {
  /** Schema revision used by this contract. */
  readonly schemaVersion: AdminPatternSchemaVersion;
  /** Stable built-in pattern identifier. */
  readonly id: AdminHtmlPatternId;
  /** Human-readable neutral pattern name. */
  readonly name: string;
  /** Structured element and cardinality contracts. */
  readonly elements: readonly AdminPatternElement[];
  /** Required attribute contracts. */
  readonly requiredAttributes: readonly AdminPatternAttribute[];
  /** Server-rendered content regions. */
  readonly regions: readonly AdminPatternRegion[];
  /** Supported state vocabulary. */
  readonly states: readonly AdminPatternState[];
  /** Public design-token variables consumed by reference CSS. */
  readonly tokenReferences: readonly AdminTokenReference[];
  /** Keyboard behavior promised by complete fixtures. */
  readonly keyboard: readonly AdminKeyboardRule[];
  /** Focus-management guarantees. */
  readonly focus: AdminFocusRules;
  /** Behavior providers required by the fixture. */
  readonly behaviorIds: readonly AdminBehaviorId[];
  /** Structured relationships between IDREF sources and ID targets. */
  readonly idReferences: readonly AdminPatternIdReference[];
  /** Complete neutral HTML example. */
  readonly htmlFixture: string;
  /** Complete Django template example with host-owned data and escaping. */
  readonly djangoFixture: string;
  /** Committed representative Django render outputs used by public CI. */
  readonly djangoRenderedFixtures: readonly string[];
}

/** Alpine data factory subset used by this package. @public */
export type AlpineDataFactory<TState extends object = object> = (
  ...params: unknown[]
) => TState;

/** Framework boundary required from Alpine 3.14.x. @public */
export interface AlpineLike {
  /** Register one Alpine data provider. */
  data(name: string, factory: AlpineDataFactory): void;
  /** Initialize behavior under an inserted element. */
  initTree?: (root: Element) => void;
  /** Destroy behavior under an element before forced reinitialization. */
  destroyTree?: (root: Element) => void;
}

/** Result of an idempotent Alpine provider registration. @public */
export interface AdminAlpineRegistration {
  /** Whether this call performed registration. */
  readonly registered: boolean;
  /** Identifier-safe prefix used by all providers. */
  readonly prefix: string;
  /** Exact registered provider names. */
  readonly providerNames: readonly string[];
}

/** Options for Alpine provider registration. @public */
export interface AdminAlpineRegistrationOptions {
  /** JavaScript-identifier-safe provider prefix; defaults to `gt`. */
  readonly prefix?: string;
}

/** htmx 2.0.x lifecycle subset used by this package. @public */
export interface HtmxLike {
  /** Register a fragment-load callback and return its removable listener. */
  onLoad(callback: (root: Node) => void): EventListener;
  /** Remove the exact listener returned by `onLoad`. */
  off(eventName: 'htmx:load', listener: EventListener): void;
}

/** Options for an individual Alpine tree hydration. @public */
export interface AdminHydrateOptions {
  /** Destroy and reinitialize even when this root was already observed. */
  readonly force?: boolean;
}

/** Instance-scoped, repeat-safe Alpine hydrator. @public */
export interface AdminHydrator {
  /** Initialize a real Element once, or force destroy-then-initialize. */
  hydrate(root: Element, options?: AdminHydrateOptions): boolean;
  /** Forget one root so a later ordinary hydration initializes it again. */
  forget(root: Element): boolean;
}

/** Options for htmx-driven hydration installation. @public */
export interface HtmxHydrationOptions {
  /** Apply forced destroy-then-initialize semantics to loaded fragments. */
  readonly force?: boolean;
}
