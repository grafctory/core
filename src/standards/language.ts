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
 * BCP 47 language tags and RFC 4647 basic language ranges, with language detection from names and web addresses.
 *
 * **Language Tags**
 *
 * Confirm that a value carries a well-formed language tag before handing it to an API that expects one:
 *
 * ```typescript
 * import { isTag } from "@metreeca/core/language";
 *
 * if (isTag(value)) {
 *   // value is typed as Tag
 * }
 * ```
 *
 * **Basic Language Ranges**
 *
 * Confirm in the same way that a value carries a well-formed basic language range, wildcard included:
 *
 * ```typescript
 * import { isTagRange } from "@metreeca/core/language";
 *
 * if (isTagRange(value)) {
 *   // value is typed as TagRange
 * }
 * ```
 *
 * **Matching**
 *
 * Select the content whose language answers a request, testing a tag against the ranges a client accepts:
 *
 * ```typescript
 * import { matchTag } from "@metreeca/core/language";
 *
 * matchTag("de-CH", "de");  // true - Swiss German matches German range
 * ```
 *
 * **Naming**
 *
 * Present a tag to readers as the name of the language it identifies, in a language they understand:
 *
 * ```typescript
 * import { nameTag } from "@metreeca/core/language";
 *
 * nameTag("zh-Hans");        // "Simplified Chinese" - named in English by default
 * nameTag("zh-Hans", "it");  // "cinese semplificato" - named in Italian
 * ```
 *
 * **Identifying**
 *
 * Read the language of records that name it in words rather than in tags, whatever language the name is written in:
 *
 * ```typescript
 * import { identifyTag } from "@metreeca/core/language";
 *
 * identifyTag("German");   // "de"
 * identifyTag("tedesco");  // "de" - named in Italian
 * ```
 *
 * **Inferring**
 *
 * Tell apart the localised versions of a web page by the language its address states:
 *
 * ```typescript
 * import { inferTag } from "@metreeca/core/language";
 *
 * inferTag("https://example.org/en/");               // "en"
 * inferTag("https://example.org/page.php?lang=de");  // "de"
 * ```
 *
 * @module
 *
 * @see {@link https://www.rfc-editor.org/info/bcp47 BCP 47 - Tags for Identifying Languages}
 * @see {@link https://www.rfc-editor.org/rfc/rfc5646.html RFC 5646 - Tags for Identifying Languages}
 * @see {@link https://www.rfc-editor.org/rfc/rfc4647.html RFC 4647 - Matching of Language Tags}
 */

import { assert, isString, lazy, opt, type Optional, safe, type URLLike } from "../index.js";
import { immutable } from "../types/values.js";



/**
 * Regular expression matching BCP 47 language tags.
 *
 * Recognises the language tag syntax defined in RFC 5646 § 2.1, excluding grandfathered tags, whatever the case of its
 * subtags. The pattern is anchored, matching a whole tag and nothing less; carrying no flags, it keeps no state
 * between tests and may be shared freely.
 *
 * Reach for it wherever a language tag is to be recognised by a regular expression rather than by a call, as in a
 * form control or a schema; {@link isTag} validates values in code.
 *
 * @remarks
 *
 * Case tolerance is built into the expression itself rather than left to an `i` flag, so that its `source` carries the
 * whole grammar wherever flags aren't available.
 *
 * @see {@link https://www.rfc-editor.org/info/bcp47 BCP 47 - Tags for Identifying Languages}
 * @see {@link https://www.rfc-editor.org/rfc/rfc5646.html RFC 5646 - Tags for Identifying Languages}
 */
export const TagPattern = (() => {

	const language = "(?:[a-zA-Z]{2,3}(?:-[a-zA-Z]{3}){0,3}|[a-zA-Z]{4}|[a-zA-Z]{5,8})"; // 2-3 + extlang / 4 / 5-8
	const script = "(?:-[a-zA-Z]{4})?"; // optional 4-letter script
	const region = "(?:-(?:[a-zA-Z]{2}|[0-9]{3}))?"; // optional 2-letter or 3-digit region
	const variant = "(?:-(?:[a-zA-Z0-9]{5,8}|[0-9][a-zA-Z0-9]{3}))*"; // zero or more variants
	const extension = "(?:-[0-9a-wA-Wy-zY-Z](?:-[a-zA-Z0-9]{2,8})+)*"; // zero or more extensions
	const privateUse = "(?:-[xX](?:-[a-zA-Z0-9]{1,8})+)?"; // optional private use
	const privateOnly = "[xX](?:-[a-zA-Z0-9]{1,8})+"; // standalone private use tag
	const langtag = `${language}${script}${region}${variant}${extension}${privateUse}`;

	return new RegExp(`^(?:${langtag}|${privateOnly})$`);

})();

/**
 * Regular expression matching RFC 4647 basic language ranges.
 *
 * Recognises the basic language range syntax defined in RFC 4647 § 2.1, whatever the case of its subtags: a sequence
 * of subtags or the standalone `*` wildcard. The pattern is anchored, matching a whole range and nothing less;
 * carrying no flags, it keeps no state between tests and may be shared freely.
 *
 * Reach for it wherever a language range is to be recognised by a regular expression rather than by a call, as in a
 * form control or a schema; {@link isTagRange} validates values in code.
 *
 * @remarks
 *
 * Case tolerance is built into the expression itself rather than left to an `i` flag, so that its `source` carries the
 * whole grammar wherever flags aren't available.
 *
 * @see {@link https://www.rfc-editor.org/info/bcp47 BCP 47 - Tags for Identifying Languages}
 * @see {@link https://www.rfc-editor.org/rfc/rfc4647.html RFC 4647 - Matching of Language Tags}
 */
export const TagRangePattern = /^(?:[a-zA-Z]{1,8}(?:-[a-zA-Z0-9]{1,8})*|\*)$/;


/**
 * The query parameters stating the language of a page.
 */
const QueryParameters = immutable(["lang", "language", "locale", "lng", "hl"]);

/**
 * The ISO 639-2 special-purpose codes, which the runtime may name although they identify no language.
 */
const SpecialCodes = immutable(["mis", "mul", "und", "zxx"]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The English language names supplied by the runtime, used to tell known language codes from unknown ones.
 */
const english = lazy(() => new Intl.DisplayNames(["en"], { type: "language", fallback: "none" }));

/**
 * The ISO 639-1 tags of the languages the runtime can name, leaving out deprecated aliases such as `iw` for `he`.
 */
const tags = lazy((): readonly Tag[] => {

	const letters = [..."abcdefghijklmnopqrstuvwxyz"];

	return letters
		.flatMap(first => letters.map(second => `${first}${second}`))
		.filter(tag => Intl.getCanonicalLocales(tag)[0] === tag && english().of(tag) !== undefined);

});

/**
 * The normalised names of the languages in {@link tags}, in every locale for which the runtime supplies its own names.
 */
const names = lazy(() => Intl.DisplayNames.supportedLocalesOf(tags())
	.map(locale => new Intl.DisplayNames([locale], { type: "language", fallback: "none" }))
	.flatMap(display => tags().flatMap(tag => opt(display.of(tag), label => [{ label: normalize(label), tag }], [])))
);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Language tag as defined by BCP 47/RFC 5646 § 2.1.
 *
 * A language tag identifies a natural language (e.g., `en` for English, `fr-CA` for Canadian French)
 * and consists of subtags for language, script, region, variant, and extension components.
 *
 * **Grammar**
 *
 * Matches BCP 47 language tag pattern per RFC 5646 § 2.1:
 *
 * ```
 * Language-Tag = langtag / privateuse / grandfathered
 * langtag = language ["-" script] ["-" region] *("-" variant) *("-" extension) ["-" privateuse]
 * ```
 *
 * Grandfathered tags are omitted from validation for simplicity.
 *
 * > [!WARNING]
 * > This is a type alias for documentation only: values must be validated at runtime with {@link isTag}.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc5646.html RFC 5646 - Tags for Identifying Languages}
 * @see {@link https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes ISO 639-2 Language Codes}
 */
export type Tag = string

/**
 * Basic language range as defined by RFC 4647 § 2.1.
 *
 * A language range matches language tags for content negotiation and filtering. A basic language range is
 * either a sequence of subtags (e.g., `en`, `en-US`, `zh-Hans-CN`), or the standalone `*` wildcard matching
 * any language tag.
 *
 * **Grammar**
 *
 * Matches the basic language range pattern per RFC 4647 § 2.1:
 *
 * ```
 * language-range = (1*8ALPHA *("-" 1*8alphanum)) / "*"
 * ```
 *
 * > [!WARNING]
 * > This is a type alias for documentation only: values must be validated at runtime with {@link isTagRange}.
 *
 * > [!IMPORTANT]
 * > Extended language ranges with interior or trailing `*` (e.g., `de-*`, `*-CH`) are not valid: under
 * > RFC 4647 basic filtering they carry no extra matching power over their basic prefix.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4647.html RFC 4647 - Matching of Language Tags}
 * @see {@link Tag}
 */
export type TagRange = string


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Checks if a value is a valid language tag.
 *
 * Validates language tags according to BCP 47/RFC 5646 § 2.1, excluding grandfathered tags. A language tag is a
 * sequence of subtags identifying a natural language, for example `en`, `fr-CA` or `zh-Hans-CN`; case is not
 * significant, so `EN-us` is accepted alongside `en-US`.
 *
 * @param value The value to validate as a language tag
 *
 * @returns true if `value` is a well-formed language tag; false otherwise
 *
 * @see {@link Tag}
 */
export function isTag(value: unknown): value is Tag {
	return isString(value) && value.length > 0 && TagPattern.test(value);
}

/**
 * Checks if a value is a valid basic language range.
 *
 * Validates basic language ranges according to RFC 4647 § 2.1. A basic language range is a sequence of subtags, for
 * example `en` or `en-US`, or the standalone `*` wildcard; case is not significant, so `EN-US` is accepted alongside
 * `en-US`.
 *
 * @param value The value to validate as a basic language range
 *
 * @returns true if `value` is a well-formed basic language range; false otherwise
 *
 * @see {@link TagRange}
 */
export function isTagRange(value: unknown): value is TagRange {
	return isString(value) && value.length > 0 && TagRangePattern.test(value);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Checks if a language tag matches a basic language range.
 *
 * Implements Basic Filtering per RFC 4647 § 3.3.1. Matching is case-insensitive:
 *
 * - The standalone `*` range matches any language tag
 * - Otherwise the range matches if it equals the tag, or equals a prefix of the tag ending at a subtag
 *   boundary (the tag character following the prefix is `-`)
 *
 * @param tag The language tag to test
 * @param range The basic language range to match against
 *
 * @returns `true` if the tag matches the range pattern; `false` otherwise
 *
 * @throws {@link !TypeError TypeError} If `tag` is not a valid language tag or `range` is not a valid basic language
 *     range
 *
 * @example
 *
 * ```typescript
 * import { matchTag } from "@metreeca/core/language";
 *
 * matchTag("de-CH", "de");      // true  - de-CH has subtag prefix de
 * matchTag("de-CH", "de-CH");   // true  - exact match
 * matchTag("de", "de-CH");      // false - range is longer than tag
 * matchTag("deu", "de");        // false - de is not a subtag prefix of deu
 * matchTag("en-US", "*");       // true  - wildcard matches any tag
 * ```
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4647.html#section-3.3.1 RFC 4647 § 3.3.1 - Basic Filtering}
 * @see {@link Tag}
 * @see {@link TagRange}
 */
export function matchTag(tag: Tag, range: TagRange): boolean {

	const $tag = assert(tag, isTag).toLowerCase();
	const $range = assert(range, isTagRange).toLowerCase();

	// basic filtering: the '*' wildcard matches any tag; otherwise the range must equal the tag or a
	// subtag prefix of it (the character following the prefix in the tag is "-")

	return $range === "*" || $tag === $range || $tag.startsWith(`${$range}-`);

}

/**
 * Names the language identified by a language tag.
 *
 * Every subtag a tag carries is taken into account: the name reflects the language, script, region and variant
 * subtags, while extension and private use subtags, which carry no name of their own, are ignored.
 *
 * > [!IMPORTANT]
 * > Names are supplied by the JavaScript runtime: availability and wording vary with the platform and with the
 * > language the name is given in. Names are intended for display and must not be relied on as stable values for
 * > comparison or storage.
 *
 * @param tag The language {@link Tag} identifying the language to be named
 * @param locale The language {@link Tag} identifying the language the name is to be given in; defaults to English; a
 * well-formed tag the runtime doesn't support is replaced by the runtime default language
 *
 * @returns The name of the language identified by `tag`, given in the language identified by `locale`, or `tag` as it
 * stands if either tag isn't well-formed or no name is available
 *
 * @see {@link identifyTag} for the converse, identifying the language a name refers to
 */
export function nameTag(tag: Tag, locale: Tag = "en"): string {

	return safe(() => new Intl.DisplayNames([locale], { type: "language" }).of(new Intl.Locale(tag).baseName)) || tag;

}

/**
 * Identifies the language a name refers to.
 *
 * Resolves languages named in words rather than in tags, whatever language the name is written in: `German`,
 * `tedesco`, `Deutsch` and `allemand` all identify `de`. Names are matched ignoring case, accents and surrounding
 * whitespace. A name that different locales give to different languages, as `Akan`, identifies none of them: an
 * ambiguous name is never resolved by a guess the caller could mistake for a reliable match.
 *
 * > [!IMPORTANT]
 * > Names are supplied by the JavaScript runtime: the names recognised vary with the platform, and only languages with
 * > a two-letter ISO 639-1 code are identified, so that `Hawaiian`, coded `haw` alone, identifies nothing.
 *
 * @param name The name of the language, written in any language
 *
 * @returns The ISO 639-1 tag of the language `name` refers to, or `undefined` if `name` refers to no language the
 * runtime knows, or to more than one language in the different locales it is written in
 *
 * @example
 *
 * ```typescript
 * import { identifyTag } from "@metreeca/core/language";
 *
 * identifyTag("German");    // "de"
 * identifyTag("Français");  // "fr"
 * identifyTag("francais");  // "fr" - accents ignored
 * identifyTag("de");        // undefined - a tag, not a name
 * ```
 *
 * @see {@link nameTag} for the converse, naming the language a tag identifies
 */
export function identifyTag(name: string): Optional<Tag> {

	const key = normalize(name);
	const matches = names().filter(({ label }) => label === key).map(({ tag }) => tag);

	return matches.every(tag => tag === matches[0]) ? matches[0] : undefined;

}

/**
 * Infers the language of a web page from its address.
 *
 * Tells apart the localised versions of a page published on the same site, as `https://example.org/en/` and
 * `https://example.org/pt`, which share a host and differ only in the language their address states. The language is
 * read from the first of the following parts of the address that states one, ignoring any later ones:
 *
 * - a `lang`, `language`, `locale`, `lng` or `hl` query parameter holding a two- or three-letter code, as in
 *   `?lang=en` or `?lang=fil`, or a language name in any language, as in `?lang=English` or `?lang=Inglese`
 * - a path segment holding a two-letter code, with an optional region, as in `/en/`, `/en-gb/` or `/courses/EN/`
 * - an underscore- or space-separated file name word holding a code or a name of a language with a two-letter code,
 *   as in `home_en.htm`, `report_eng.pdf` or `Guida – Versione Inglese.pdf`, ignoring the file extension
 *
 * Hosts and the words of hyphenated slugs are never read, so `/universite-de-paris` isn't taken as German. Codes that
 * identify no language, as `und` or `zxx`, are ignored. Path segments and file name words admit fewer codes to keep
 * ordinary words from passing for languages: `/iii/`, `/mal/` and `new_report.pdf` aren't read as Sichuan Yi,
 * Malayalam or Newari, the languages their three-letter codes would otherwise state.
 *
 * > [!TIP]
 * > Restrict `languages` to the languages a site is published in to rule out codes such as `/id/` or `/my/`, which
 * > name records and personal areas far more often than they state Indonesian or Burmese.
 *
 * @param url The address of the page; addresses other than absolute `http` or `https` URLs state no language
 * @param languages The tags of the languages the page may be in, matched by base language, so that `pt-PT` admits
 * `pt`; codes and names stating other languages are ignored, as if absent; if omitted, any language is read
 *
 * @returns The ISO 639-1 tag of the language `url` states, or its ISO 639-2 code if it has no two-letter tag, stripped
 * of script and region subtags, or `undefined` if `url` states no language, or none admitted by `languages`
 *
 * @example
 *
 * ```typescript
 * import { inferTag } from "@metreeca/core/language";
 *
 * inferTag("https://example.org/en/");                    // "en"
 * inferTag("https://example.org/page.php?lang=de");       // "de"
 * inferTag("https://example.org/home_en.htm");            // "en"
 * inferTag("https://example.org/id/1234");                // "id"
 * inferTag("https://example.org/id/1234", ["en", "fr"]);  // undefined - Indonesian not admitted
 * inferTag("https://www.example.de/");                    // undefined - hosts never read
 * ```
 *
 * @see {@link identifyTag} for reading languages named in words
 */
export function inferTag(url: URLLike, languages?: readonly Tag[]): Optional<Tag> {

	const parsed = opt(safe(() => new URL(url)), parsed => /^https?:$/.test(parsed.protocol) ? parsed : undefined);
	const path = parsed?.pathname ?? "";

	const segments = (safe(() => decodeURIComponent(path)) ?? path).split("/");
	const file = segments.at(-1)?.match(/^(.+)\.[a-z0-9]+$/i)?.[1] ?? "";

	const targets = languages?.map(language => safe(() => new Intl.Locale(language).language) ?? language);

	return parsed === undefined ? undefined : [
		...QueryParameters.map(name => language(parsed.searchParams.get(name) ?? "")),
		...segments.filter(segment => /^[a-z]{2}(?:[-_][a-z]{2})?$/i.test(segment)).map(language),
		...file.split(/[_\s]+/).map(language).map(tag => tag?.length === 2 ? tag : undefined)
	].find(tag => tag !== undefined && (targets === undefined || targets.includes(tag)));


	function language(value: string): Optional<Tag> {

		const code = safe(() => new Intl.Locale(value.replaceAll("_", "-")).language);

		return code !== undefined && !SpecialCodes.includes(code) && english().of(code) !== undefined ? code
			: value.length > 3 ? identifyTag(value)
				: undefined;

	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Normalises a language name for lookup, ignoring case, accents and surrounding whitespace.
 */
function normalize(name: string): string {
	return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
