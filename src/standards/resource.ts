/*
 * Copyright © 2025-2026 Metreeca srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * RFC 3987 resource identifiers.
 *
 * Provides types and functions for validating resource identifiers (IRIs), telling links a browser can open apart from
 * other identifiers, checking nesting relationships and navigating identifier hierarchies, extracting hosts and display
 * labels from identifiers, resolving and rewriting references, creating and inspecting namespace objects, and minting
 * IRIs for local resources through the predefined {@link base} namespace. Prefix lexicons compact IRIs to the prefixed
 * names used in SPARQL and Turtle text, and expand those names back to full IRIs. Names written against a lexicon
 * round-trip to the identifiers they abbreviate, and every name a lexicon produces pastes verbatim into query text.
 *
 * **Type Guards**
 *
 * ```typescript
 * import { isIRI } from "@grafctory/core/resource";
 *
 * const value = "http://example.org/resource";
 *
 * if (isIRI(value)) {
 *   // value is typed as IRI
 * }
 *
 * // Variant-specific checks
 *
 * isIRI("https://example.org/resource", "browsable"); // true
 * isIRI("mailto:user@example.org", "browsable");      // false
 * isIRI("http://example.org/resource", "absolute");   // true
 * isIRI("/resource", "internal");                     // true
 * isIRI("../resource", "relative");                   // true
 * isIRI("http://example.org/资源", "absolute");        // true (Unicode allowed)
 * ```
 *
 * **Nesting Checks**
 *
 * ```typescript
 * import { isNestedIRI } from "@grafctory/core/resource";
 *
 * isNestedIRI("http://example.com/a/", "http://example.com/a/b");   // true
 * isNestedIRI("http://example.com/a/", "http://example.com/a/");    // true (self-nesting)
 * isNestedIRI("http://example.com/a/", "http://example.com/x/y");   // false
 * ```
 *
 * **Reference Operations**
 *
 * ```typescript
 * import {
 *   getIRIBase, getIRIHost, getIRILabel, getIRIParent, internalize, relativize, resolve
 * } from "@grafctory/core/resource";
 *
 * const iri = "http://example.com/a/b/c";
 *
 * // Resolve relative references against base
 *
 * resolve(iri, "../d");                        // "http://example.com/a/d"
 * resolve(iri, "/d");                          // "http://example.com/d"
 *
 * // Convert absolute to root-relative (internal) path
 *
 * internalize(iri, "http://example.com/x/y");  // "/x/y"
 *
 * // Convert absolute to relative path
 *
 * relativize(iri, "http://example.com/a/d");   // "../d"
 *
 * // Extract the base identifier usable for reference resolution
 *
 * getIRIBase(iri);                             // "http://example.com/"
 * getIRIBase("/a/b");                          // undefined
 *
 * // Extract the identifier of the enclosing collection
 *
 * getIRIParent(iri);                           // "http://example.com/a/b/"
 * getIRIParent("/a/b/");                       // "/a/"
 * getIRIParent("a");                           // "./"
 *
 * // Extract the host for compact display of web addresses
 *
 * getIRIHost(iri);                             // "example.com"
 * getIRIHost("mailto:user@example.com");       // undefined
 *
 * // Derive a display label from the last segment
 *
 * getIRILabel("http://example.com/fineArts");  // "Fine Arts"
 * ```
 *
 * **Namespace Objects**
 *
 * ```typescript
 * import { base, createNamespace, getNamespaceBase, getNamespaceIRI } from "@grafctory/core/resource";
 *
 * // Closed namespace with predefined terms
 *
 * const rdfs = createNamespace("http://www.w3.org/2000/01/rdf-schema#", [
 *   "label",
 *   "comment"
 * ]);
 *
 * rdfs[""];           // IRI: "http://www.w3.org/2000/01/rdf-schema#"
 * rdfs.label;         // IRI: "http://www.w3.org/2000/01/rdf-schema#label"
 * rdfs["comment"];    // IRI: "http://www.w3.org/2000/01/rdf-schema#comment"
 * rdfs["seeAlso"];    // throws RangeError: unknown term
 *
 * // Namespace accessors
 *
 * getNamespaceIRI(rdfs);   // IRI: "http://www.w3.org/2000/01/rdf-schema#"
 * getNamespaceBase(rdfs);  // IRI: "http://www.w3.org/"
 *
 * // Open namespace for dynamic terms
 *
 * const ex = createNamespace("http://example.org/");
 *
 * ex[""];             // IRI: "http://example.org/"
 * ex["anything"];     // IRI: "http://example.org/anything"
 *
 * // Predefined open namespace for local resources
 *
 * base[""];           // IRI: "base:/#"
 * base.label;         // IRI: "base:/#label"
 * ```
 *
 * **Compact URIs**
 *
 * ```typescript
 * import { compact, createLexicon, createNamespace, expand } from "@grafctory/core/resource";
 *
 * const lexicon = createLexicon({
 *   rdfs: "http://www.w3.org/2000/01/rdf-schema#",
 *   ex: createNamespace("https://example.org/")
 * });
 *
 * // Compact IRIs to prefixed names
 *
 * compact(lexicon, "http://www.w3.org/2000/01/rdf-schema#label");  // "rdfs:label"
 * compact(lexicon, "https://example.com/Book");                    // undefined (undeclared namespace)
 *
 * // Expand prefixed names to IRIs
 *
 * expand(lexicon, "ex:Book");                                      // "https://example.org/Book"
 * expand(lexicon, "owl:Class");                                    // "owl:Class" (undeclared prefix)
 * ```
 *
 * @module
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc3986.html RFC 3986 - Uniform Resource Identifiers (URIs)}
 * @see {@link https://www.rfc-editor.org/rfc/rfc3987.html RFC 3987 - Internationalized Resource Identifiers (IRIs)}
 * @see {@link https://www.w3.org/TR/curie/ CURIE Syntax 1.0}
 * @see {@link https://www.w3.org/TR/rdfa-core/#s_curies RDFa Core 1.1 § 6 - CURIE Syntax Definition}
 * @see {@link https://www.w3.org/TR/sparql11-query/#prefNames SPARQL 1.1 Query Language § 4.1.1.1 - Prefixed Names}
 * @see {@link https://www.w3.org/TR/turtle/#sec-iri RDF 1.1 Turtle § 2.4 - IRIs}
 */

import { assert, error, isString, type Optional, safe } from "../index.js";
import { by, compound, descending } from "../patterns/order.js";


/**
 * Matches scheme: ALPHA *( ALPHA / DIGIT / "+" / "-" / "." ) ":"
 */
const SchemePattern = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Matches scheme followed by a non-empty authority: scheme ":" "//" 1*( any but "/" / "?" / "#" )
 */
const HostPattern = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]/i;

/**
 * Excluded characters per RFC 3987 § 2.2: control chars, whitespace, special chars, isolated surrogates
 *
 * The `ucschar` production skips the surrogate block U+D800-U+DFFF, so no conforming IRI holds one; under unicode
 * matching a well-formed pair folds into the single supplementary code point it denotes, leaving the surrogate range
 * to match unpaired code units only.
 */
const ExcludedPattern = /[\x00-\x1F\x7F-\x9F\s<>"{}|\\^`\uD800-\uDFFF]/u;

/**
 * Matches prefix: [ ALPHA *( ALPHA / DIGIT / "_" / "-" ) ]
 */
const PrefixPattern = /^([A-Za-z][A-Za-z0-9_-]*)?$/;

/**
 * Matches local name: ( ALPHA / "_" ) *( ALPHA / DIGIT / "_" / "-" )
 */
const LocalPattern = /^[A-Za-z_][A-Za-z0-9_-]*$/;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Base namespace for local resources.
 *
 * An open {@link Namespace} rooted at the synthetic `base:/` origin, minting absolute IRIs for local resources that
 * have no deployment origin of their own. Terms are appended to the fragment component, so generated IRIs are
 * `"hierarchical"` identifiers sharing the `base:/` root and resolving relative references against it.
 *
 * As `base:` IRIs carry no authority component, {@link internalize} and {@link relativize} return root-relative paths
 * for them, rather than the path-relative references they return for schemes with an authority, such as `http:`.
 *
 * > [!NOTE]
 * > Provisional IANA registration of the `base` URI scheme under RFC 7595 is pending as [IANA #1462001].
 *
 * @example
 *
 * ```typescript
 * base[""];                               // IRI: "base:/#"
 * base.label;                             // IRI: "base:/#label"
 *
 * getIRIBase(base.label);                 // "base:/"
 * resolve(base[""], "x/y");               // "base:/x/y"
 * relativize("base:/a/b", "base:/a/c");   // "/a/c" (root-relative, not "c")
 * ```
 */
export const base = createNamespace("base:/#");


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Internationalized Resource Identifier (IRI) as defined by RFC 3987.
 *
 * An IRI is a sequence of characters that identifies an abstract or physical resource.
 * IRIs extend URIs (RFC 3986) by allowing Unicode characters beyond the ASCII subset.
 * Every valid URI is also a valid IRI.
 *
 * > [!WARNING]
 * > This is a type alias for documentation only: values must be validated at runtime with {@link isIRI}.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc3986.html RFC 3986 - URI Generic Syntax}
 * @see {@link https://www.rfc-editor.org/rfc/rfc3987.html#section-2.2 RFC 3987 § 2.2 - IRI Syntax}
 */
export type IRI =
	| string

/**
 * Identifier variant per RFC 3986 §§ 4.2-4.3.
 *
 * - `"browsable"`: `http:` or `https:` with a host, a link a browser can open (`https://example.org/path`)
 * - `"hierarchical"`: Absolute with hierarchical path (`http://example.org/path`, `base:/path`)
 * - `"absolute"`: Contains scheme (`http://example.org/path`, `urn:example:resource`)
 * - `"internal"`: Root-relative path starting with a single `/` (`/path`)
 * - `"relative"`: Reference without scheme or authority (`../path`, `path`)
 *
 * @remarks
 *
 * - Variants form an inclusivity hierarchy: `browsable ⊂ hierarchical ⊂ absolute ⊂ internal ⊂ relative`
 *
 * - The `"hierarchical"` variant requires an absolute URI with a path starting with `/`;
 *   authority is optional per RFC 3986 § 3 `hier-part` grammar (`path-absolute` alternative);
 *   reference resolution is supported per RFC 3986 § 5.2.3
 *
 * - The `"browsable"` and `"hierarchical"` variants are checked on the value as written rather than on its normalized
 *   form, so `http:path`, `http:/path` and `http:///path` are neither browsable nor hierarchical even though the URL
 *   API repairs all three into `http://path/`, turning a path segment into a host the value never named
 *
 * - The `"browsable"` and `"internal"` variants are project-specific, not formally defined in RFC 3986
 *
 * - No variant admits an authority supplied by a reference: references opening with `//` (network-path references per
 *   RFC 3986 § 4.2) are rejected whatever the variant
 *
 * - For non-hierarchical (opaque) URIs such as `urn:` or `mailto:`, reference operations adapt:
 *   - {@link resolve}: Throws `RangeError` for relative references (no standard resolution)
 *   - {@link internalize}: Returns scheme-specific part if schemes match
 *   - {@link relativize}: Returns scheme-specific part if schemes match
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc3986#section-4.2 RFC 3986 § 4.2 - Relative Reference}
 * @see {@link https://www.rfc-editor.org/rfc/rfc3986#section-4.3 RFC 3986 § 4.3 - Absolute URI}
 */
export type Variant =
	| "browsable"
	| "hierarchical"
	| "absolute"
	| "internal"
	| "relative"

/**
 * Compact URI abbreviating an IRI with a namespace prefix.
 *
 * A compact URI is a prefixed name such as `rdfs:label`, joining a prefix to a local name with a colon. The prefix may
 * be empty, as in `:label`, to abbreviate IRIs in the default namespace of a {@link Lexicon}.
 *
 * > [!WARNING]
 * > This is a type alias for documentation only: values must be validated at runtime with {@link isCURIE}.
 *
 * @see {@link isCURIE} for validating compact URIs
 * @see {@link compact} for compacting IRIs to compact URIs
 * @see {@link expand} for expanding compact URIs to IRIs
 * @see {@link https://www.w3.org/TR/curie/ CURIE Syntax 1.0}
 */
export type CURIE =
	| string

/**
 * Object type for accessing IRIs within a common namespace.
 *
 * Provides IRI access via property lookup. The namespace IRI itself is available via the empty
 * string key (`ns[""]`), while terms are accessed as named properties (`ns.label` or `ns["label"]`).
 *
 * @typeParam T Predefined term names for closed namespace access
 *
 * @see {@link createNamespace} for creating namespace objects
 * @see {@link getNamespaceIRI} for retrieving the namespace IRI
 * @see {@link getNamespaceBase} for retrieving the base identifier of the namespace IRI
 */
export type Namespace<T extends readonly string[] = []> =
	T extends readonly [] ? {

		readonly [""]: IRI
		readonly [term: string]: IRI

	} : {

		readonly [""]: IRI

	} & {

		readonly [K in T[number]]: IRI

	}

/**
 * Namespace prefixes for writing IRIs as compact URIs.
 *
 * Maps each prefix to the {@link Namespace} it abbreviates. The empty prefix declares the default namespace,
 * whose IRIs are compacted to and expanded from prefixed names such as `:name`, with nothing before the colon.
 *
 * Local names are restricted to an ASCII letter or `_`, followed by ASCII letters, digits, `_` or `-`. This is a
 * subset of the SPARQL and Turtle prefixed name grammars and of the compact URI syntax, so every prefixed name produced
 * can be pasted verbatim into SPARQL or Turtle text, with no escaping of reserved characters.
 *
 * Lexicons must be created with {@link createLexicon}, which validates their prefixes: a malformed prefix then fails
 * where the lexicon is declared, rather than later, when IRIs are compacted or expanded against it.
 *
 * @see {@link createLexicon} for creating validated lexicons
 * @see {@link compact} for compacting IRIs to prefixed names
 * @see {@link expand} for expanding prefixed names to IRIs
 */
export type Lexicon = {

	readonly [prefix: string]: Namespace

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Checks if a value is a valid IRI.
 *
 * Validates IRIs according to RFC 3987 with variant-specific rules:
 *
 * - `"browsable"`: `http:` or `https:` with a host (`https://host/...`), a link a browser can open
 * - `"hierarchical"`: Absolute with root-relative path (`scheme:/...`), usable as a resolution base
 * - `"absolute"`: Hierarchical or opaque (`scheme:...`)
 * - `"internal"`: Root-relative (`/...`) or absolute
 * - `"relative"`: Any well-formed reference
 *
 * Paths are normalized per RFC 3986 § 5.2.4, which clips `..` segments climbing above the root rather than rejecting
 * them, so `/a/../../x` is accepted wherever the `/x` it denotes is. References opening with `//` name an authority
 * (RFC 3986 § 4.2) and are rejected whatever the variant, as no variant admits an authority supplied by a reference.
 *
 * **Excluded characters** (per RFC 3987 § 2.2): Control characters (U+0000-U+001F, U+007F-U+009F), whitespace, and
 * `< > " { } | \ ^ `` ` (backtick). Text is checked as it stands, without stripping: surrounding whitespace or embedded
 * control characters cause rejection, so values taken from user input must be trimmed before the check
 *
 * **Ill-formed text**: Strings carrying an isolated UTF-16 surrogate are rejected in every variant: the `ucschar`
 * production of RFC 3987 § 2.2 skips the surrogate block U+D800-U+DFFF, so no conforming IRI holds one, and encoding
 * such a string to UTF-8, as percent-encoding requires, would substitute `U+FFFD` REPLACEMENT CHARACTER for the
 * surrogate, yielding a different identifier
 *
 * @param value The value to validate as an IRI
 * @param variant The identifier variant to validate against (default: `"relative"`)
 *
 * @returns `true` if the value is a well-formed string conforming to IRI syntax rules for the specified variant;
 *   `false` otherwise
 *
 * @remarks
 *
 * This function serves as a type guard, narrowing `value` to {@link IRI} when used in conditional checks.
 *
 * @see {@link IRI}
 * @see {@link Variant}
 * @see {@link https://www.rfc-editor.org/rfc/rfc3987.html#section-2.2 RFC 3987 § 2.2 - IRI Syntax}
 */
export function isIRI(value: unknown, variant: Variant = "relative"): value is IRI {

	return normalize(value, variant) !== undefined;

}

/**
 * Checks if a parent identifier nests a child identifier.
 *
 * Nesting holds if the path of `child` is equal to or extends the path of `parent` at a segment boundary, that is if
 * `parent` is a path prefix of `child` when compared segment by segment: a parent always nests itself
 * (`isNestedIRI(x, x)` is true), while segment-boundary matching prevents false positives (`/a/b` doesn't nest
 * `/a/bc`).
 *
 * Nesting is defined only for absolute hierarchical identifiers, that is a scheme followed by a root-relative path;
 * opaque, internal, and relative references are reported as not nesting, as are strings carrying an isolated UTF-16
 * surrogate. Query strings and fragments are ignored: only the path component is compared.
 *
 * @param parent The potential parent identifier
 * @param child The potential child identifier
 *
 * @returns true if `parent` and `child` are both valid `"hierarchical"` identifiers sharing scheme and authority and
 *   `parent` nests `child`; false otherwise
 *
 * @see {@link Variant}
 */
export function isNestedIRI(parent: string | IRI, child: string | IRI): boolean {

	const $parent = normalize(parent, "hierarchical");
	const $child = normalize(child, "hierarchical");

	if ( $parent === undefined || $child === undefined ) { return false; } else {

		const parentURL = new URL($parent);
		const childURL = new URL($child);

		// paths are compared closed by a slash, so that nesting holds at segment boundaries only

		return sameOrigin(parentURL, childURL)
			&& childURL.pathname.replace(/\/?$/, "/").startsWith(parentURL.pathname.replace(/\/?$/, "/"));

	}

}


/**
 * Extracts the base identifier from a hierarchical identifier.
 *
 * Returns the scheme and authority components followed by a trailing slash, suitable for use as a base identifier in
 * reference resolution. Path, query, and fragment components are discarded.
 *
 * - **With authority** (for example, `http://example.org/a/b?q#f`): returns `scheme://authority/`
 * - **Without authority** (for example, `base:/a/b`): returns `scheme:/`
 * - **Empty authority** (for example, `file:///a/b`): returns `scheme:///`
 *
 * @param iri The hierarchical identifier to extract the base from
 *
 * @returns The base as a hierarchical identifier terminated by a trailing slash, or `undefined` if `iri` is not
 *   a valid hierarchical identifier (opaque URIs, internal paths, relative references, or strings carrying an
 *   isolated UTF-16 surrogate)
 *
 * @see {@link resolve} for resolving references against a base identifier
 * @see {@link getIRIHost} for extracting the host alone, for compact display
 * @see {@link getNamespaceBase} for extracting the base identifier of a {@link Namespace}
 * @see {@link https://www.rfc-editor.org/rfc/rfc3986#section-5.1 RFC 3986 § 5.1 - Establishing a Base URI}
 */
export function getIRIBase(iri: string | IRI): Optional<IRI> {

	const $iri = normalize(iri, "hierarchical");

	if ( $iri === undefined ) { return undefined; } else {

		const { protocol, host } = new URL($iri);

		const hasAuthority = $iri.charAt($iri.indexOf(":")+2) === "/";

		return hasAuthority
			? `${protocol}//${host}/`
			: `${protocol}/`;

	}

}

/**
 * Extracts the identifier of the collection enclosing a reference.
 *
 * Navigates one level up a path hierarchy: the parent of a member (`a/b`) is the collection holding it (`a/`), and the
 * parent of a collection (`a/b/`) is the collection enclosing it (`a/`). The parent always ends with a slash, drops the
 * query and fragment of `iri`, and keeps its variant:
 *
 * - **Hierarchical** (for example, `http://example.org/a/b?q#f`, `base:/a/b/`): an absolute identifier sharing scheme
 *   and authority (`http://example.org/a/`, `base:/a/`), down to the root path (`http://example.org/a` and
 *   `http://example.org/a/` both yield `http://example.org/`)
 * - **Internal** (for example, `/a/b`): a root-relative path (`/a/`), down to the root path (`/a` yields `/`)
 * - **Relative** (for example, `a/b`, `a`, `../a/`): a path-relative reference (`a/`, `./`, `../`); as relative
 *   references may climb indefinitely, a parent always exists, expressed through `..` segments where needed (`..`
 *   yields `../../`)
 *
 * Dot segments are resolved per RFC 3986 § 5.2.4, so `http://example.org/a/./b/../c` yields `http://example.org/a/`
 * and `a/../b` yields `./`; relative references keep their leading `..` segments, as no base is there to absorb them.
 *
 * Rooted parents whose path opens with an empty segment keep a `/.` guard, so `/a/..//b` yields `/.//` rather than a
 * `//` that would read as a network-path reference naming an authority (RFC 3986 § 4.2).
 *
 * @param iri The reference to extract the parent from
 *
 * @returns The parent reference, or `undefined` if `iri` has none: root paths of hierarchical and internal references,
 *   opaque identifiers (for example, `urn:example:a`), relative references with an empty path (for example, `""`,
 *   `?q`, `#f`, whose parent depends on the base they are resolved against), and invalid references (for example,
 *   strings carrying an isolated UTF-16 surrogate or opening with `//`)
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc3986#section-5.2.4 RFC 3986 § 5.2.4 - Remove Dot Segments}
 */
export function getIRIParent(iri: string | IRI): Optional<IRI> {

	const $iri = normalize(iri, "relative");

	const [, origin = "", path = ""] = $iri?.match(/^([a-z][a-z0-9+.-]*:(?:\/\/[^/?#]*)?)?([^?#]*)/i) ?? [];

	const rooted = path.startsWith("/");

	// rooted paths are already free of dot segments, save for the `/.` guarding an opening empty segment, which goes
	// with the last segment it guards; relative ones still carry them

	const parent = rooted ? path.replace(/[^/]*\/?$/, "").replace(/^\/\.\/$/, "/")
		: removeDotSegments(`${path.replace(/\/$/, "")}/..`);

	// opaque identifiers, root paths and empty relative paths have no enclosing collection; an empty relative parent is
	// the current collection; RFC 3986 § 4.2: an empty first segment would read as a root-relative path, a colon in the
	// first segment as a scheme; relative parents open with a `./` dot segment in all three cases

	return path === "" || path === "/" || origin !== "" && !rooted ? undefined
		: rooted || !/^(?:$|[^/]*:|\/)/.test(parent) ? `${origin}${parent}`
			: `./${parent}`;

}

/**
 * Extracts the host from an identifier.
 *
 * Provides a compact label for a web address where the full identifier is too long to show, as in outbound link text.
 *
 * @param iri The identifier to extract the host from
 *
 * @returns The host of `iri` in lower case, without port or user info and with internationalized names kept readable
 *   rather than punycode-encoded, or `undefined` if `iri` names no host, as for opaque identifiers such as `mailto:`
 *   addresses and `urn:` names, for relative references, and for text that is not a valid IRI
 *
 * @example
 *
 * ```typescript
 * getIRIHost("https://www.uc.pt/en/");          // "www.uc.pt"
 * getIRIHost("https://Example.org:8080/a");     // "example.org"
 * getIRIHost("https://città.it/");              // "città.it"
 * getIRIHost("http://[::1]:8080/a");            // "[::1]"
 * getIRIHost("mailto:user@example.org");        // undefined
 * ```
 *
 * @see {@link getIRIBase} for extracting the base identifier, scheme and authority included
 */
export function getIRIHost(iri: string | IRI): Optional<string> {

	// host matched on the original text, as normalization punycode-encodes internationalized names

	return normalize(iri, "hierarchical") === undefined ? undefined
		: iri.match(/^[a-z][-+.a-z0-9]*:\/\/(?:[^/?#@]*@)?(\[[^\]/?#@]*]|[^/?#:@[\]]+)/i)?.[1]?.toLowerCase();

}

/**
 * Derives a readable label from an identifier.
 *
 * Provides a human-readable fallback wherever a resource must be shown but no label is at hand. The label is taken from
 * the fragment or the last path segment, so vocabulary terms are named after themselves. Primary topic markers such as
 * `#this` or `#id` are skipped, so a resource described by a document is named after that document. Camel, kebab and
 * snake case are split into capitalised words, and digits stay attached to the word they follow.
 *
 * > [!IMPORTANT]
 * > Never use labels as identifiers, since distinct resources may share the same label.
 *
 * @param iri The identifier to derive the label from
 *
 * @returns A label for the resource identified by `iri`, or `undefined` if `iri` carries no segment to derive one from
 *
 * @example
 *
 * ```typescript
 * getIRILabel("https://example.com/terms#FineArts");      // "Fine Arts"
 * getIRILabel("https://example.com/people/alice#this");   // "Alice"
 * getIRILabel("urn:isbn:1234");                           // "1234"
 * ```
 */
export function getIRILabel(iri: string | IRI): Optional<string> {

	return iri
			.replace(/^.*?(?:[/#:]([^/#:]+))?(?:\/|#|#_|#id|#this)?$/, "$1") // last segment, past any primary topic
			// marker
			.replace(/([a-z0-9])([A-Z])/g, "$1 $2") // camel case
			.replace(/[-_]+/g, " ") // kebab and snake case
			.replace(/\b[a-z]/g, initial => initial.toUpperCase())
		|| undefined;

}


/**
 * Resolves a reference against a base identifier.
 *
 * - **Hierarchical identifiers**: Implements RFC 3986 § 5 reference resolution, combining `base` and `reference`
 *   to produce an absolute identifier
 * - **Opaque identifiers** (e.g., `urn:`, `mailto:`): Absolute references are returned unchanged; relative
 *   references cannot be resolved and throw an error
 *
 * Resolution never escapes the root of `base`: `..` segments climbing above it are clipped as prescribed by the
 * RFC 3986 § 5.4.2 abnormal examples, so the resolved identifier always carries the scheme and authority of `base`.
 *
 * @remarks
 *
 * While RFC 3986 § 5 defines a path-merging algorithm that technically applies to all URI schemes, opaque identifiers
 * lack the hierarchical path such merging operates on, leaving relative resolution semantically undefined: a relative
 * reference against an opaque base is rejected outright, rather than resolved to an identifier its scheme gives no
 * meaning to.
 *
 * @param base The absolute base identifier to resolve against
 * @param reference The reference to resolve
 *
 * @returns The resolved absolute identifier
 *
 * @throws {@link !RangeError RangeError} If `base` is not a valid absolute identifier or `reference` is not a valid
 *   relative reference, for instance because it carries an isolated UTF-16 surrogate or opens with `//`
 * @throws {@link !RangeError RangeError} If a relative reference cannot be resolved against an opaque base
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc3986#section-5 RFC 3986 § 5 - Reference Resolution}
 * @see {@link https://www.rfc-editor.org/rfc/rfc3986#section-5.4.2 RFC 3986 § 5.4.2 - Abnormal Examples}
 */
export function resolve(base: string | IRI, reference: string | IRI): IRI {

	const $base = asIRI(base, "absolute");
	const $reference = asIRI(reference, "relative");

	const baseURL = new URL($base);

	const opaqueBase = !baseURL.pathname.startsWith("/");
	const relativeReference = !SchemePattern.test($reference);

	return opaqueBase && relativeReference
		? error(new RangeError(`cannot resolve relative <${$reference}> against non-hierarchical <${$base}>`))
		: new URL($reference, baseURL).href;

}

/**
 * Extracts a root-relative reference.
 *
 * - **Hierarchical identifiers**: Returns the root-relative path (starting with `/`) if scheme and authority match
 * - **Opaque identifiers**: Returns the scheme-specific part if schemes match
 *
 * A root-relative path opening with an empty segment is returned with a `/.` guard (`/.//a`), so that it cannot read
 * as a network-path reference naming an authority and still resolves back to `reference` against `base`.
 *
 * @param base The absolute base identifier providing the scheme and authority context
 * @param reference The reference to internalize
 *
 * @returns A root-relative reference if `reference` shares scheme and authority with `base`, or the normalized
 *   absolute reference otherwise
 *
 * @throws {@link !RangeError RangeError} If `base` is not a valid absolute identifier or `reference` is not a valid
 *   relative reference, for instance because it carries an isolated UTF-16 surrogate or opens with `//`
 */
export function internalize(base: string | IRI, reference: string | IRI): IRI {

	const baseURL = new URL(asIRI(base, "absolute"));
	const referenceURL = new URL(asIRI(reference, "relative"), baseURL);

	return sameOrigin(baseURL, referenceURL)

		// same origin: return root-relative path (already normalized by URL API)

		? detach(referenceURL)

		// different origin: return absolute reference (already normalized by URL API)

		: referenceURL.href;

}

/**
 * Creates a relative reference from base to reference.
 *
 * - **Hierarchical identifiers**: Computes the shortest path-relative reference that, when resolved against `base`,
 *   yields `reference`
 * - **Authority-less hierarchical identifiers** (`base:/…`, `file:///…`): Returns the root-relative path
 * - **Opaque identifiers**: Returns the scheme-specific part if schemes match
 *
 * The returned reference always resolves back to `reference` under RFC 3986 § 5 and under any conforming URL parser,
 * so callers may resolve it against `base` without further escaping. A first segment carrying a colon is prefixed with
 * a `./` dot segment, so it cannot read as a scheme. Where an empty first segment would read as an authority, the
 * absolute reference is returned instead, and root-relative paths for authority-less bases take a `/.` guard.
 *
 * @param base The absolute base identifier
 * @param reference The reference to relativize
 *
 * @returns A relative reference from `base` to `reference`, or the normalized absolute reference if not relativizable
 *
 * @throws {@link !RangeError RangeError} If `base` is not a valid absolute identifier or `reference` is not a valid
 *   relative reference, for instance because it carries an isolated UTF-16 surrogate or opens with `//`
 */
export function relativize(base: string | IRI, reference: string | IRI): IRI {

	const baseURL = new URL(asIRI(base, "absolute"));
	const referenceURL = new URL(asIRI(reference, "relative"), baseURL);

	// different origins take the absolute reference, already normalized by the URL API; authority-less bases the
	// root-relative path, as no path-relative reference could restore the authority

	return !sameOrigin(baseURL, referenceURL) ? referenceURL.href
		: baseURL.host === "" ? detach(referenceURL)
			: relative();


	function relative(): IRI {

		const baseParts = baseURL.pathname.split("/").slice(0, -1); // directory segments
		const refParts = referenceURL.pathname.split("/");

		const commonLength = baseParts.reduce(
			(len, seg, i) => len < i || seg !== refParts[i] ? len : len+1,
			0
		);

		const upSegments = baseParts.slice(commonLength).map(() => "..");
		const downSegments = refParts.slice(commonLength);
		const relativePath = [...upSegments, ...downSegments].join("/") || ".";

		// RFC 3986 § 4.2 — an empty first segment would read as an authority, a colon in the first segment as a
		// scheme. Where no dot segment can disambiguate, fall back to the absolute reference.

		return relativePath.startsWith("/") ? referenceURL.href
			: `${/^[^/]*:/.test(relativePath) ? "./" : ""}${relativePath}${referenceURL.search}${referenceURL.hash}`;

	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates an immutable {@link Namespace} object for generating and accessing IRIs from a common base.
 *
 * @typeParam T Predefined term names, inferred from the `terms` argument
 *
 * @param namespace The absolute base IRI to which terms are appended
 * @param terms Optional array of predefined term names to restrict access to
 *
 * @returns An immutable {@link Namespace} object with typed term properties
 *
 * @throws {@link !RangeError RangeError} If the namespace is not a valid absolute IRI, for instance because it
 *   carries an isolated UTF-16 surrogate, or if any term produces an invalid IRI during initialisation. For open
 *   namespaces, also throws when accessing a term that produces an invalid IRI. For closed namespaces, also throws
 *   when accessing an unknown term name.
 *
 * @remarks
 *
 * **Open namespaces** (no terms provided): Accept any term name dynamically, constructing IRIs on demand.
 *
 * **Closed namespaces** (terms provided): Restrict access to predefined terms only, throwing errors
 * for unknown term names.
 *
 * > [!WARNING]
 * > Accessing an unknown term on a closed namespace throws a `RangeError` at runtime,
 * > even though TypeScript's type system may not flag the access at compile time (e.g., when using
 * > bracket notation with a dynamic key).
 *
 * @see {@link getNamespaceIRI} for retrieving the namespace IRI
 * @see {@link getNamespaceBase} for retrieving the base identifier of the namespace IRI
 */
export function createNamespace<const T extends readonly string[]>(namespace: string | IRI, terms?: T): Namespace<T> {

	if ( !isString(namespace) ) {
		throw new TypeError("expected string");
	}

	const $namespace = asIRI(namespace, "absolute"); // validate namespace eagerly

	const dictionary = Object.assign(Object.create(null), Object.fromEntries([
		["", $namespace],
		...(terms ?? []).map(term => [term, asIRI($namespace+term, "absolute")])
	]));

	return Object.freeze(new Proxy(dictionary, {

		get(target, key) {

			return !isString(key) ? undefined
				: key in target ? target[key]
					: terms && terms.length > 0
						? error(new RangeError(`unknown term <${key}> in namespace <${$namespace}>`))
						: asIRI($namespace+key, "absolute");

		}

	})) as Namespace<T>;

}


/**
 * Retrieves the IRI of a namespace.
 *
 * Returns the absolute IRI the namespace was created with, which prefixes every term it mints. The accessor offers a
 * named alternative to the empty string key (`namespace[""]`), returning the same IRI under a self-describing call.
 *
 * @param namespace The namespace to retrieve the IRI from
 *
 * @returns The absolute IRI of `namespace`
 *
 * @example
 *
 * ```typescript
 * getNamespaceIRI(base);                             // "base:/#"
 * getNamespaceIRI(createNamespace("urn:example:"));  // "urn:example:"
 * ```
 *
 * @see {@link Namespace}
 * @see {@link createNamespace}
 * @see {@link getNamespaceBase}
 */
export function getNamespaceIRI(namespace: Namespace): IRI {

	return namespace[""];

}

/**
 * Retrieves the base identifier of a namespace.
 *
 * Returns the scheme and authority components of the namespace IRI, as extracted by {@link getIRIBase}. The result is
 * a base identifier suitable for resolving references against the IRIs minted by the namespace.
 *
 * @param namespace The namespace to retrieve the base identifier from
 *
 * @returns The base identifier of the IRI of `namespace`, terminated by a trailing slash, or `undefined` if the
 *   namespace IRI is opaque, that is not a hierarchical identifier (for example, `urn:example:`)
 *
 * @example
 *
 * ```typescript
 * getNamespaceBase(createNamespace("http://example.org/a/ns#"));  // "http://example.org/"
 * getNamespaceBase(createNamespace("urn:example:"));              // undefined
 * ```
 *
 * @see {@link Namespace}
 * @see {@link createNamespace}
 * @see {@link getNamespaceIRI}
 * @see {@link getIRIBase}
 */
export function getNamespaceBase(namespace: Namespace): Optional<IRI> {

	return getIRIBase(namespace[""]);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates an immutable {@link Lexicon}.
 *
 * Validates prefix declarations at creation, so that a malformed one fails immediately rather than producing invalid
 * prefixed names when IRIs are later compacted or expanded against the resulting lexicon.
 *
 * A prefix is an ASCII letter followed by ASCII letters, digits, `_` or `-`, as admitted by the SPARQL and Turtle
 * grammars. The empty prefix is also accepted, and declares the default namespace of the lexicon.
 *
 * @param lexicon The namespaces to declare, keyed by prefix, as absolute IRIs or {@link Namespace} objects
 *
 * @returns An immutable lexicon with the same prefixes, and IRI namespaces converted to {@link Namespace} objects
 *
 * @throws {@link !TypeError TypeError} If a prefix is malformed
 * @throws {@link !RangeError RangeError} If a namespace IRI is not absolute
 *
 * @see {@link https://www.w3.org/TR/sparql11-query/#rPN_PREFIX SPARQL 1.1 Query Language § 19.8 - PN_PREFIX}
 */
export function createLexicon(lexicon: { readonly [prefix: string]: string | IRI | Namespace }): Lexicon {

	return Object.freeze(Object.fromEntries(Object.entries(lexicon).map(([prefix, namespace]) => [
		assert(prefix, prefix => PrefixPattern.test(prefix), `malformed prefix <${prefix}>`),
		isString(namespace) ? createNamespace(namespace) : namespace
	])));

}


/**
 * Checks if a value is a valid compact URI.
 *
 * Accepts prefixed names made of a prefix, a colon and a local name, such as `rdfs:label` or `:label`. Prefixes follow
 * the rules enforced by {@link createLexicon} and local names the rules described for {@link Lexicon}. The check is
 * purely syntactic and accepts any well-formed prefix, whether declared in a lexicon or otherwise.
 *
 * @param value The value to validate as a compact URI
 *
 * @returns `true` if `value` is a string made of a prefix, possibly empty, a colon and a local name; `false` otherwise
 *
 * @remarks
 *
 * This function serves as a type guard, narrowing the type from `unknown` to {@link CURIE} in conditional checks.
 *
 * @see {@link CURIE}
 */
export function isCURIE(value: unknown): value is CURIE {

	const colon = isString(value) ? value.indexOf(":") : -1;

	return isString(value) && colon >= 0
		&& PrefixPattern.test(value.slice(0, colon))
		&& LocalPattern.test(value.slice(colon+1));

}


/**
 * Converts an IRI to a compact URI, if a declared namespace abbreviates it.
 *
 * Turns IRIs such as `http://www.w3.org/2000/01/rdf-schema#label` into prefixed names such as `rdfs:label`, for compact
 * use in SPARQL, Turtle or JSON-LD text. If several declared namespaces abbreviate the IRI, the longest one is used. If
 * several prefixes declare that namespace, the first one in code point order is used, whatever the declaration order,
 * so the empty prefix always wins. An IRI has no compact form if it is in no declared namespace, or if the part after
 * the namespace is not a valid local name, as defined for {@link Lexicon}. Such IRIs must be written in full.
 *
 * @param lexicon The lexicon to compact against
 * @param iri The absolute IRI to compact
 *
 * @returns The prefixed name abbreviating `iri`, or `undefined` if no declared namespace abbreviates it
 *
 * @see {@link expand} for the reverse conversion
 */
export function compact(lexicon: Lexicon, iri: IRI): Optional<CURIE> {

	return (isIRI(iri, "absolute") ? Object.entries(lexicon) : [])
		.map(([prefix, namespace]) => [prefix, getNamespaceIRI(namespace)])
		.filter(([, base]) => iri.startsWith(base) && LocalPattern.test(iri.slice(base.length)))
		.sort(compound(by(([, base]) => base.length, descending), by(([prefix]) => prefix)))
		.map(([prefix, base]) => `${prefix}:${iri.slice(base.length)}`)
		.at(0);

}

/**
 * Expands a compact URI to an IRI.
 *
 * Turns prefixed names such as `rdfs:label` into the IRIs they abbreviate, so that IRIs written in compact form can be
 * used as identifiers. A name is expanded only if its prefix is declared and its local name is valid. Any other value
 * is returned unchanged, including names with an undeclared prefix and full IRIs such as `https://example.org/Book`.
 *
 * > [!IMPORTANT]
 * > Values returned unchanged must be validated at runtime with {@link isIRI} where an IRI is required.
 *
 * @param lexicon The lexicon to expand against
 * @param name The prefixed name or IRI to expand
 *
 * @returns The IRI abbreviated by `name`, or `name` itself if its prefix is undeclared or its local name is invalid
 *
 * @see {@link compact} for the reverse conversion
 */
export function expand(lexicon: Lexicon, name: CURIE | IRI): IRI {

	if ( isCURIE(name) ) {

		const colon = name.indexOf(":");
		const prefix = name.slice(0, colon);
		const local = name.slice(colon+1);

		return Object.hasOwn(lexicon, prefix)
			? `${getNamespaceIRI(lexicon[prefix])}${local}`
			: name;

	} else {

		return name;

	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Checks if two identifiers share scheme and authority.
 *
 * Compares the authority components directly rather than through `URL.origin`, which RFC 6454 § 4 serializes as the
 * opaque string `"null"` for every scheme outside the WHATWG special set: identifiers differing only by authority
 * would otherwise compare as same-origin under schemes such as `app:` and `file:`.
 *
 * @param base The base URL
 * @param reference The reference URL
 *
 * @returns `true` if `base` and `reference` share scheme and authority; `false` otherwise
 */
function sameOrigin(base: URL, reference: URL): boolean {

	return base.protocol === reference.protocol && base.host === reference.host;

}

/**
 * Validates and normalizes a reference.
 *
 * Performs syntax validation (string type, excluded characters, isolated surrogates, network-path references), path
 * normalization per RFC 3986 § 5.2.4 (Remove Dot Segments), and variant-specific validation.
 *
 * @param value The value to validate and normalize
 * @param variant The identifier variant
 *
 * @returns The validated and normalized reference, or `undefined` if invalid
 */
function normalize(value: unknown, variant: Variant): Optional<IRI> {

	// syntax validation

	const validSyntax = isString(value) && !ExcludedPattern.test(value);
	const hasScheme = validSyntax && SchemePattern.test(value);

	// network-path references (RFC 3986 § 4.2) name an authority no variant admits: rejected rather than silently
	// stripped of it

	const hasAuthority = validSyntax && !hasScheme && value.startsWith("//");

	// path normalization (URL API silently clips excessive `..` at root)

	const normalized = !validSyntax || hasAuthority ? undefined
		: hasScheme ? safe(() => new URL(value).href)
			: value.startsWith("/") ? internal(value)
				: value; // relative paths: keep `.` and `..` for later resolution

	return normalized !== undefined && admits(normalized) ? normalized : undefined;


	// variant validation (hierarchy: browsable ⊂ hierarchical ⊂ absolute ⊂ internal ⊂ relative); hosts are checked on
	// the value as written, as the URL API repairs `http:/path` into `http://path/`, inventing a host the value never
	// named

	function admits(normalized: IRI): boolean {

		const hasHost = hasScheme && HostPattern.test(value);
		const inventsHost = !hasHost && HostPattern.test(normalized);
		const isHierarchical = hasScheme && value.charAt(value.indexOf(":")+1) === "/" && !inventsHost;
		const isBrowsable = hasHost && /^https?:/i.test(value);
		const isAbsolute = hasScheme && normalized.indexOf(":") < normalized.length-1;
		const isInternal = isAbsolute || normalized.startsWith("/");

		return variant === "browsable" && isBrowsable
			|| variant === "hierarchical" && isHierarchical
			|| variant === "absolute" && isAbsolute
			|| variant === "internal" && isInternal
			|| variant === "relative";

	}

	// the URL API parses no reference without a base and engines disagree on synthetic ones: root-relative references
	// take the form it would give them inside an absolute identifier, dropping empty queries and fragments and
	// percent-encoding the non-ASCII characters, the only ones left to encode once the excluded ones are ruled out; a
	// path left opening with an empty segment takes a `/.` guard, as it would otherwise read as naming an authority

	function internal(reference: string): IRI {

		const [, path = "", query = "", fragment = ""] = reference.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/) ?? [];
		const guarded = removeDotSegments(path).replace(/^\/\//, "/.//");

		return [guarded, query === "?" ? "" : query, fragment === "#" ? "" : fragment]
			.join("")
			.replace(/[^\x00-\x7F]+/g, encodeURIComponent);

	}

}

/**
 * Removes the dot segments of a path per RFC 3986 § 5.2.4.
 *
 * Reads percent-encoded dots as dots and closes paths ending with a dot segment with a slash, as the URL API does.
 *
 * @param path The path to remove dot segments from
 *
 * @returns The path without dot segments; `..` segments climbing above the root of a rooted path are clipped, while
 *   those opening a relative path are retained, as no base is available to absorb them
 */
function removeDotSegments(path: string): string {

	const rooted = path.startsWith("/");

	return (rooted ? "/" : "")+path.slice(rooted ? 1 : 0)
		.replace(/(?<=^|\/)(?:\.|%2e){1,2}(?=\/|$)/gi, dots => dots.replace(/%2e/gi, "."))
		.replace(/(?<=^|\/)\.{1,2}$/, "$&/")
		.split("/")
		.reduce(step, [])
		.join("/");


	function step(stack: readonly string[], segment: string): readonly string[] {

		return segment === "." ? stack
			: segment !== ".." ? [...stack, segment]
				: stack.length > 0 && stack.at(-1) !== ".." ? stack.slice(0, -1)
					: rooted ? stack
						: [...stack, segment];

	}

}

/**
 * Detaches the root-relative reference of a URL from its scheme and authority.
 *
 * @param url The parsed URL
 *
 * @returns The path, query and fragment of `url`; a path opening with an empty segment takes a `/.` guard, as away
 *   from its authority it would otherwise read as a network-path reference naming one
 */
function detach(url: URL): IRI {

	return url.pathname.replace(/^\/\//, "/.//")+url.search+url.hash;

}

/**
 * Validates and normalizes a required reference.
 *
 * @param value The value to validate and normalize
 * @param variant The identifier variant
 *
 * @returns The validated and normalized reference
 *
 * @throws {@link !RangeError RangeError} If `value` is not a valid reference of the given `variant`
 */
function asIRI(value: unknown, variant: Variant): IRI {

	return normalize(value, variant) ?? error(new RangeError(`invalid ${variant} reference <${value}>`));

}
