/**
 * @module
 * @private
 * @internal
 */

import * as symbols from "./symbols";
import { SelectionType } from "../types/FindSelected";
import { Matcher, MatcherType, AnyMatcher } from "../types/Pattern";
import isArray from "@rbxts/phantom/src/Array/isArray";
import { keys, values } from "@rbxts/phantom/src/Shared";
import slice from "@rbxts/phantom/src/Array/slice";
import concat from "@rbxts/phantom/src/Array/concat";

// @internal
export const isObject = (value: unknown): value is object => typeIs(value, "table");

//   @internal
export const isMatcher = (x: unknown): x is Matcher<unknown, unknown, MatcherType, SelectionType> => {
	const pattern = x as Matcher<unknown, unknown, MatcherType, SelectionType>;
	return pattern && !!pattern[symbols.matcher];
};

// @internal
const isOptionalPattern = (x: unknown): x is Matcher<unknown, unknown, "optional", SelectionType> => {
	return isMatcher(x) && x[symbols.matcher]().matcherType === "optional";
};

// tells us if the value matches a given pattern.
// @internal
export const matchPattern = (pattern: any, value: any, select_: (key: string, value: unknown) => void): boolean => {
	if (isMatcher(pattern)) {
		const matcher = pattern[symbols.matcher]();
		const { matched, selections } = matcher.match(value);
		if (matched && selections) {
			keys(selections).forEach((key) => select_(key, selections[key]));
		}
		return matched;
	}

	if (isObject(pattern)) {
		if (!isObject(value)) return false;

		// Tuple pattern
		if (isArray(pattern)) {
			if (!isArray(value)) return false;
			let startPatterns = [];
			let endPatterns = [];
			let variadicPatterns: AnyMatcher[] = [];

			for (const i of keys(pattern)) {
				const subpattern = pattern[i];
				if (isMatcher(subpattern) && subpattern[symbols.isVariadic]) {
					variadicPatterns.push(subpattern);
				} else if (variadicPatterns.size()) {
					endPatterns.push(subpattern);
				} else {
					startPatterns.push(subpattern);
				}
			}

			if (variadicPatterns.size()) {
				if (variadicPatterns.size() > 1) {
					error(`Pattern error: Using \`...P.array(...)\` several times in a single pattern is not allowed.`);
				}

				if (value.size() < startPatterns.size() + endPatterns.size()) {
					return false;
				}

				const startValues = slice(value, 0, startPatterns.size());
				const endValues = endPatterns.size() === 0 ? [] : slice(value, -endPatterns.size());
				const middleValues = slice(
					value,
					startPatterns.size(),
					endPatterns.size() === 0 ? math.huge : -endPatterns.size(),
				);

				return (
					(startPatterns as defined[]).every((subPattern, i) => matchPattern(subPattern, startValues[i], select_)) &&
					(endPatterns as defined[]).every((subPattern, i) => matchPattern(subPattern, endValues[i], select_)) &&
					(variadicPatterns.size() === 0 ? true : matchPattern(variadicPatterns[0], middleValues, select_))
				);
			}

			return pattern.size() === value.size()
				? (pattern as defined[]).every((subPattern, i) => matchPattern(subPattern, value[i], select_))
				: false;
		}

		return keys(pattern).every((k): boolean => {
			const subPattern = pattern[k];

			return (k in value || isOptionalPattern(subPattern)) && matchPattern(subPattern, value[k], select_);
		});
	}

	return (value as unknown) === (pattern as unknown);
};

// @internal
export const getSelectionKeys = (pattern: any): string[] => {
	if (isObject(pattern)) {
		if (isMatcher(pattern)) {
			return pattern[symbols.matcher]().getSelectionKeys?.() ?? [];
		}
		if (isArray(pattern)) return flatMap(pattern, getSelectionKeys);
		return flatMap(values(pattern), getSelectionKeys);
	}
	return [];
};

// @internal
export const flatMap = <a, b>(xs: readonly a[], f: (v: a) => readonly b[]): b[] =>
	(xs as readonly defined[]).reduce<b[]>((acc, x) => concat(acc, f(x as a)), []);
