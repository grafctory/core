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

import { describe, expect, it } from "vitest";
import { identifyTag, inferTag, isTag, isTagRange, matchTag, nameTag } from "./language.js";


const tags = {
	valid: [
		"en",
		"fr",
		"de",
		"eng",
		"fra",
		"zh-Hans",
		"zh-Hant",
		"en-US",
		"en-GB",
		"fr-CA",
		"es-419",
		"sr-Latn-RS",
		"zh-Hans-CN",
		"en-US-x-private",
		"EN",
		"EN-us",
		"en-US-X-PRIVATE",
		"en-A-bbb",
		"X-PRIVATE"
	],
	invalid: [
		{ value: "", reason: "empty string" },
		{ value: "e", reason: "single character" },
		{ value: "toolongprimary", reason: "primary subtag > 8 chars" },
		{ value: "en_US", reason: "underscore separator" },
		{ value: "en US", reason: "space separator" },
		{ value: "en-", reason: "trailing hyphen" },
		{ value: "-en", reason: "leading hyphen" },
		{ value: "en--US", reason: "double hyphen" },
		{ value: "123", reason: "numeric only primary" },
		{ value: "en-123456789", reason: "variant > 8 chars" },
		{ value: "http://example.com", reason: "contains invalid chars" }
	]
};

const ranges = {
	valid: [
		"*",
		"en",
		"en-US",
		"zh-Hans-CN",
		"a",
		"abcdefgh",
		"en-12345678",
		"EN-US",
		"ZH-HANS-CN"
	],
	invalid: [
		{ value: "", reason: "empty string" },
		{ value: "-", reason: "hyphen only" },
		{ value: "-en", reason: "leading hyphen" },
		{ value: "en-", reason: "trailing hyphen" },
		{ value: "en--US", reason: "double hyphen" },
		{ value: "en-*", reason: "trailing wildcard (extended range)" },
		{ value: "*-CH", reason: "leading wildcard (extended range)" },
		{ value: "de-*-DE", reason: "interior wildcard (extended range)" },
		{ value: "*-*", reason: "wildcard subtags (extended range)" },
		{ value: "*-*-*", reason: "wildcard subtags (extended range)" },
		{ value: "toolongsub", reason: "subtag > 8 chars" },
		{ value: "en-123456789", reason: "subtag > 8 chars" },
		{ value: "en_US", reason: "underscore separator" },
		{ value: "en US", reason: "space separator" }
	]
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("isTag()", () => {

	it("should return true for valid language tags", () => {
		tags.valid.forEach(value => {
			expect(isTag(value)).toBe(true);
		});
	});

	it("should return false for invalid language tags", () => {
		tags.invalid.forEach(({ value }) => {
			expect(isTag(value)).toBe(false);
		});
	});

	it("should return false for non-string values", () => {
		expect(isTag(null)).toBe(false);
		expect(isTag(undefined)).toBe(false);
		expect(isTag(123)).toBe(false);
		expect(isTag({})).toBe(false);
		expect(isTag([])).toBe(false);
	});

});

describe("isTagRange()", () => {

	it("should return true for valid language ranges", () => {
		ranges.valid.forEach(value => {
			expect(isTagRange(value)).toBe(true);
		});
	});

	it("should return false for invalid language ranges", () => {
		ranges.invalid.forEach(({ value }) => {
			expect(isTagRange(value)).toBe(false);
		});
	});

	it("should return false for non-string values", () => {
		expect(isTagRange(null)).toBe(false);
		expect(isTagRange(undefined)).toBe(false);
		expect(isTagRange(123)).toBe(false);
		expect(isTagRange({})).toBe(false);
		expect(isTagRange([])).toBe(false);
	});

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("matchTag()", () => {

	// RFC 4647 § 3.3.1 Basic Filtering test cases

	describe("wildcard range", () => {

		it("should match any tag with '*' range", async () => {
			expect(matchTag("en", "*")).toBe(true);
			expect(matchTag("en-US", "*")).toBe(true);
			expect(matchTag("zh-Hans-CN", "*")).toBe(true);
		});

	});

	describe("exact match", () => {

		it("should match equal tags", async () => {
			expect(matchTag("en", "en")).toBe(true);
			expect(matchTag("de", "de")).toBe(true);
			expect(matchTag("zh-Hans", "zh-Hans")).toBe(true);
			expect(matchTag("en-US", "en-US")).toBe(true);
		});

	});

	describe("prefix match", () => {

		it("should match a range that is a subtag prefix of the tag", async () => {
			expect(matchTag("en-US", "en")).toBe(true);
			expect(matchTag("en-GB", "en")).toBe(true);
			expect(matchTag("zh-Hans-CN", "zh")).toBe(true);
			expect(matchTag("zh-Hans-CN", "zh-Hans")).toBe(true);
			expect(matchTag("en-US-x-private", "en-US")).toBe(true);
		});

	});

	describe("non-matching", () => {

		it("should not match when first subtags differ", async () => {
			expect(matchTag("en", "de")).toBe(false);
			expect(matchTag("fr", "en")).toBe(false);
		});

		it("should not match when the range is longer than the tag", async () => {
			expect(matchTag("en", "en-US")).toBe(false);
			expect(matchTag("zh", "zh-Hans")).toBe(false);
		});

		it("should not match a prefix that does not align to a subtag boundary", async () => {
			expect(matchTag("deu", "de")).toBe(false);
			expect(matchTag("eng", "en")).toBe(false);
		});

	});

	describe("case insensitivity", () => {

		it("should match case-insensitively", async () => {
			expect(matchTag("en-US", "EN-us")).toBe(true);
			expect(matchTag("EN-US", "en-us")).toBe(true);
			expect(matchTag("zh-Hans", "ZH-HANS")).toBe(true);
			expect(matchTag("DE-CH", "de")).toBe(true);
		});

	});

	describe("validation", () => {

		it("should throw for an invalid tag", async () => {
			expect(() => matchTag("en_US", "en")).toThrow();
		});

		it("should throw for an invalid range", async () => {
			expect(() => matchTag("de-CH", "de-*")).toThrow();
		});

		it("should throw for former extended-range matches", async () => {
			// ranges that matched under § 3.3.2 extended filtering are no longer valid ranges
			expect(() => matchTag("de-Latn-DE", "de-*-DE")).toThrow();
			expect(() => matchTag("en-US", "*-US")).toThrow();
			expect(() => matchTag("fr-Latn-CH", "*-CH")).toThrow();
		});

	});

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("nameTag()", () => {

	describe("language subtag", () => {

		it("should name a language identified by a 2-letter subtag", async () => {
			expect(nameTag("en")).toBe("English");
			expect(nameTag("fr")).toBe("French");
			expect(nameTag("de")).toBe("German");
		});

		it("should name a language identified by a 3-letter subtag", async () => {
			expect(nameTag("eng")).toBe("English");
			expect(nameTag("fra")).toBe("French");
		});

	});

	describe("script, region and variant subtags", () => {

		it("should qualify the name with the script subtag", async () => {
			expect(nameTag("zh-Hans")).toBe("Simplified Chinese");
			expect(nameTag("zh-Hant")).toBe("Traditional Chinese");
		});

		it("should qualify the name with the region subtag", async () => {
			expect(nameTag("en-US")).toBe("American English");
			expect(nameTag("en-GB")).toBe("British English");
			expect(nameTag("fr-CA")).toBe("Canadian French");
			expect(nameTag("es-419")).toBe("Latin American Spanish");
		});

		it("should qualify the name with the variant subtag", async () => {
			expect(nameTag("de-CH-1901")).toBe("Swiss High German (Traditional German orthography)");
		});

		it("should qualify the name with script and region subtags together", async () => {
			expect(nameTag("sr-Latn-RS")).toBe("Serbian (Latin, Serbia)");
			expect(nameTag("zh-Hans-CN")).toBe("Chinese (Simplified, China)");
		});

	});

	describe("locale-only subtags", () => {

		it("should leave private use subtags out of the name", async () => {
			expect(nameTag("en-US-x-private")).toBe("American English");
		});

		it("should leave extension subtags out of the name", async () => {
			expect(nameTag("en-u-ca-gregory")).toBe("English");
		});

	});

	describe("case insensitivity", () => {

		it("should name a language whatever the case of its subtags", async () => {
			expect(nameTag("EN-us")).toBe("American English");
			expect(nameTag("ZH-hans")).toBe("Simplified Chinese");
		});

	});

	describe("naming language", () => {

		it("should default to English", async () => {
			expect(nameTag("fr")).toBe(nameTag("fr", "en"));
		});

		it("should give the name in the requested language", async () => {
			expect(nameTag("fr", "it")).toBe("francese");
			expect(nameTag("zh-Hans", "it")).toBe("cinese semplificato");
			expect(nameTag("en-US", "fr")).toBe("anglais américain");
			expect(nameTag("de", "de")).toBe("Deutsch");
		});

		it("should fall back on the runtime default language if the requested one isn't supported", async () => {
			expect(nameTag("en", "zz")).toBe("English");
		});

	});

	describe("fallback", () => {

		it("should return a malformed tag as it stands", async () => {
			expect(nameTag("en_US")).toBe("en_US");
			expect(nameTag("")).toBe("");
			expect(nameTag("toolongprimary")).toBe("toolongprimary");
		});

		it("should return the tag as it stands if the naming language is malformed", async () => {
			expect(nameTag("fr", "it_IT")).toBe("fr");
			expect(nameTag("fr", "")).toBe("fr");
		});

		it("should return a tag it knows no name for as it stands", async () => {
			expect(nameTag("qaa")).toBe("qaa");
			expect(nameTag("zzz")).toBe("zzz");
		});

	});

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("identifyTag()", () => {

	it("should resolve a language name given in English", async () => {
		expect(identifyTag("German")).toBe("de");
		expect(identifyTag("Dutch")).toBe("nl");
	});

	it("should resolve a language name given in any language", async () => {
		expect(identifyTag("tedesco")).toBe("de");
		expect(identifyTag("Deutsch")).toBe("de");
		expect(identifyTag("allemand")).toBe("de");
	});

	it("should ignore case", async () => {
		expect(identifyTag("GERMAN")).toBe("de");
		expect(identifyTag("german")).toBe("de");
	});

	it("should ignore accents", async () => {
		expect(identifyTag("Français")).toBe("fr");
		expect(identifyTag("francais")).toBe("fr");
		expect(identifyTag("espanol")).toBe("es");
	});

	it("should ignore surrounding whitespace", async () => {
		expect(identifyTag("  Italian  ")).toBe("it");
	});

	it("should not resolve tags as names", async () => {
		expect(identifyTag("de")).toBeUndefined();
		expect(identifyTag("en")).toBeUndefined();
	});

	it("should not resolve unknown names", async () => {
		expect(identifyTag("")).toBeUndefined();
		expect(identifyTag("Klingonese")).toBeUndefined();
	});

	it("should not resolve names shared by different languages", async () => {
		expect(identifyTag("Akan")).toBeUndefined(); // ak and tw
	});

});

describe("inferTag()", () => {

	it("should read the language from query parameters", async () => {
		expect(inferTag("https://studienhandbuch.jku.at/detail.php?lang=en&klaId=525DPHIPHIS21")).toBe("en");
		expect(inferTag("http://www.dke.uni-linz.ac.at/index.xq?lang=en")).toBe("en");
		expect(inferTag("https://example.org/page?language=de")).toBe("de");
		expect(inferTag("https://example.org/page?hl=fr")).toBe("fr");
		expect(inferTag("https://example.org/page?locale=pt_PT")).toBe("pt");
	});

	it("should read the language from full language tags in query parameters", async () => {
		expect(inferTag("https://example.org/page?lang=zh-Hans")).toBe("zh");
		expect(inferTag("https://example.org/page?lang=es-419")).toBe("es");
	});

	it("should read three-letter codes from query parameters", async () => {
		expect(inferTag("https://example.org/page?lang=fil")).toBe("fil");
		expect(inferTag("https://example.org/page?lang=haw")).toBe("haw");
	});

	it("should ignore special-purpose codes", async () => {
		expect(inferTag("https://example.org/page?lang=und")).toBeUndefined();
		expect(inferTag("https://example.org/page?lang=mul")).toBeUndefined();
		expect(inferTag("https://example.org/page?lang=zxx")).toBeUndefined();
	});

	it("should ignore three-letter codes with no two-letter equivalent in file names", async () => {
		expect(inferTag("https://example.org/new_report.pdf")).toBeUndefined(); // not Newari
		expect(inferTag("https://example.org/report_ita.pdf")).toBe("it");
	});

	it("should read the language from language names in query parameters", async () => {
		expect(inferTag("https://example.org/page?lang=English")).toBe("en");
	});

	it("should accept parsed URLs", async () => {
		expect(inferTag(new URL("https://example.org/en/page"))).toBe("en");
	});

	it("should read the language from path segments", async () => {
		expect(inferTag("https://www.uc.pt/en/")).toBe("en");
		expect(inferTag("https://www.uc.pt/pt")).toBe("pt");
		expect(inferTag("https://apps.uc.pt/courses/EN/course/2301")).toBe("en");
		expect(inferTag("https://www.utu.fi/fi/opiskelijaksi/opiskelijan%20palvelut")).toBe("fi");
		expect(inferTag("https://example.org/en-gb/about")).toBe("en");
	});

	it("should read the language from file names", async () => {
		expect(inferTag("http://www.ag.jku.at/home_en.htm")).toBe("en");
		expect(inferTag("https://web.unipv.it/wp-content/uploads/2022/04/GEP_defSA-1_eng.pdf")).toBe("en");
		expect(inferTag("https://portale.unipv.it/files/Codice%20Etico%20%E2%80%93%20Versione%20Inglese.pdf")).toBe("en");
	});

	it("should prefer query parameters to path segments", async () => {
		expect(inferTag("https://example.org/de/page?lang=en")).toBe("en");
	});

	it("should prefer the first path segment naming a language", async () => {
		expect(inferTag("https://example.org/fr/it/page")).toBe("fr");
	});

	it("should ignore hosts", async () => {
		expect(inferTag("https://en.example.org/")).toBeUndefined();
		expect(inferTag("https://www.uni-jena.de/")).toBeUndefined();
	});

	it("should ignore the words of hyphenated slugs", async () => {
		expect(inferTag("https://example.org/universite-de-poitiers")).toBeUndefined();
		expect(inferTag("https://www.jku.at/linz-school-of-education/abteilung-fuer-bildungsforschung/")).toBeUndefined();
	});

	it("should ignore segments naming no language", async () => {
		expect(inferTag("https://example.org/xx/page")).toBeUndefined();
		expect(inferTag("https://example.org/and/the/end.pdf")).toBeUndefined();
		expect(inferTag("https://guias.usal.es/node/4945")).toBeUndefined();
		expect(inferTag("https://utuguides.fi/vaitoskirjat")).toBeUndefined();
	});

	it("should ignore path segments with three-letter codes", async () => {
		expect(inferTag("https://www.uc.pt/iii/ceis20")).toBeUndefined(); // not Sichuan Yi
		expect(inferTag("https://www.umu.se/forskning/infrastruktur/mal/")).toBeUndefined(); // not Malayalam
		expect(inferTag("https://example.org/eng/page")).toBeUndefined();
	});

	it("should read any language if no target languages are given", async () => {
		expect(inferTag("https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000033202746")).toBe("id");
	});

	it("should read only target languages if given", async () => {
		expect(inferTag("https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000033202746", ["en", "fr"])).toBeUndefined();
		expect(inferTag("https://utu.zoom.us/my/kasvatustieteet", ["en", "fi"])).toBeUndefined();
		expect(inferTag("https://example.org/page?lang=de", ["en", "fr"])).toBeUndefined();
		expect(inferTag("https://example.org/Versione%20Inglese.pdf", ["it"])).toBeUndefined();
		expect(inferTag("https://example.org/de/en/page", ["en", "fr"])).toBe("en");
	});

	it("should match target languages by their base language", async () => {
		expect(inferTag("https://example.org/pt/page", ["pt-PT"])).toBe("pt");
		expect(inferTag("https://example.org/en/page", ["eng"])).toBe("en");
	});

	it("should return undefined for text that is no IRI", async () => {
		expect(inferTag("")).toBeUndefined();
		expect(inferTag("not a url")).toBeUndefined();
		expect(inferTag("mailto:user@example.org")).toBeUndefined();
	});

});
