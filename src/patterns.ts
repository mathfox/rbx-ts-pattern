import isArray from "@rbxts/phantom/src/Array/isArray";
import { matchPattern, getSelectionKeys, flatMap } from "./internals/helpers";
import * as symbols from "./internals/symbols";
import { matcher } from "./internals/symbols";
import { isMatching } from "./is-matching";
import { ExtractPreciseValue } from "./types/ExtractPreciseValue";
import { Fn } from "./types/helpers";
import { InvertPattern } from "./types/InvertPattern";
import {
	Pattern,
	UnknownPattern,
	OptionalP,
	ArrayP,
	MapP,
	SetP,
	AndP,
	OrP,
	NotP,
	GuardP,
	SelectP,
	AnonymousSelectP,
	GuardExcludeP,
	CustomP,
	Matcher,
	StringPattern,
	AnyPattern,
	NumberPattern,
	BooleanPattern,
	NullishPattern,
	SymbolPattern,
	Chainable,
	NumberChainable,
	StringChainable,
	ArrayChainable,
	Variadic,
	NonNullablePattern,
} from "./types/Pattern";
import { concat } from "@rbxts/phantom/src/Array";
import { isSet } from "@rbxts/phantom/src/Set";
import { isMap } from "@rbxts/phantom/src/Map";
import { entries } from "@rbxts/phantom/src/Shared";
import assign from "@rbxts/phantom/src/Object/assign";
import { String } from "@rbxts/phantom";
import isInteger from "@rbxts/phantom/src/Number/isInteger";
import isFinite from "@rbxts/phantom/src/Number/isFinite";

export type { Pattern, Fn as unstable_Fn };

export { matcher };

/**
 * @experimental
 * A `Matchable` is an object implementing
 * the Matcher Protocol. It must have a `[P.matcher]: P.Matcher<NarrowFn>`
 * key, which defines how this object should be matched by TS-Pattern.
 *
 * Note that this api is unstable.
 *
 * @example
 * ```ts
 * class Some<T> implements P.unstable_Matchable {
 *  [P.matcher](): P.unstable_Matcher<Some<T>>
 * }
 * ```
 */
export type unstable_Matchable<narrowedOrFn, input = unknown, pattern = never> = CustomP<input, pattern, narrowedOrFn>;

/**
 * @experimental
 * A `Matcher` is an object with `match` function, which
 * defines how this object should be matched by TS-Pattern.
 *
 * Note that this api is unstable.
 *
 * @example
 * ```ts
 * class Some<T> implements P.unstable_Matchable {
 *  [P.matcher](): P.unstable_Matcher<Some<T>>
 * }
 * ```
 */
export type unstable_Matcher<narrowedOrFn, input = unknown, pattern = never> = ReturnType<
	CustomP<input, pattern, narrowedOrFn>[matcher]
>;

/**
 * `P.infer<typeof somePattern>` will return the type of the value
 * matched by this pattern.
 *
 * [Read the documentation for `P.infer` on GitHub](https://github.com/gvergnaud/ts-pattern#pinfer)
 *
 * @example
 * const userPattern = { name: P.string_ }
 * type User = P.infer<typeof userPattern>
 */
export type infer<pattern extends Pattern<any>> = InvertPattern<pattern, unknown>;

/**
 * `P.narrow<Input, Pattern>` will narrow the input type to only keep
 * the set of values that are compatible with the provided pattern type.
 *
 * [Read the documentation for `P.narrow` on GitHub](https://github.com/gvergnaud/ts-pattern#pnarrow)
 *
 * @example
 * type Input = ['a' | 'b' | 'c', 'a' | 'b' | 'c']
 * const Pattern = ['a', P.union('a', 'b')] as const
 *
 * type Narrowed = P.narrow<Input, typeof Pattern>
 * //     ^? ['a', 'a' | 'b']
 */
export type narrow<input, pattern extends Pattern<any>> = ExtractPreciseValue<input, InvertPattern<pattern, input>>;

function chainable<pattern extends Matcher<any, any, any, any, any>>(pattern: pattern): Chainable<pattern> {
	return assign(pattern, {
		optional: () => optional(pattern),
		and: (p2: unknown) => intersection(pattern, p2 as any),
		or: (p2: unknown) => union(pattern, p2 as any),
		select: (key: unknown) => (key === undefined ? select_(pattern) : select_(key as any, pattern)),
	}) as Chainable<pattern>;
}

const variadic = <pattern extends {}>(pattern: pattern): Variadic<pattern> => {
	let i = 0;

	const variadicPattern = assign(pattern, {
		[symbols.isVariadic]: true,
	});

	//const values: IteratorResult<pattern, void>[] = [
	//	{ value: variadicPattern, done: false },
	//	{ done: true, value: undefined },
	//];

	function next_(self_: LuaMetatable<object>, last: unknown) {
		if (i === 0) return variadicPattern;

		return undefined;
		//		const [key] = next(self_, last);
		//		if (key === undefined) return undefined;
		//
		//		return $tuple(key, self_[key as keyof typeof self_]);
	}

	return setmetatable(pattern, {
		__iter: (self_: LuaMetatable<object>) => {
			return $tuple(next_, self_);
		},
	} as LuaMetatable<object>) as Variadic<pattern>;

	//Object.assign(pattern, {
	//	[Symbol.iterator](): Iterator<pattern, void, undefined> {
	//		let i = 0;
	//		const variadicPattern = assign(pattern, {
	//			[symbols.isVariadic]: true,
	//		});
	//		const values: IteratorResult<pattern, void>[] = [
	//			{ value: variadicPattern, done: false },
	//			{ done: true, value: undefined },
	//		];
	//		return {
	//			next: () => values[i++] ?? values.at(-1)!,
	//		};
	//	},
	//});
};

function arrayChainable<pattern extends Matcher<any, any, any, any, any>>(pattern: pattern): ArrayChainable<pattern> {
	return assign(variadic(pattern), {
		optional: () => arrayChainable(optional(pattern)),
		select: (key: unknown) => arrayChainable(key === undefined ? select_(pattern) : select_(key as any, pattern)),
	}) as any;
}

/**
 * `P.optional(subpattern)` takes a sub pattern and returns a pattern which matches if the
 * key is undefined or if it is defined and the sub pattern matches its value.
 *
 * [Read the documentation for `P.optional` on GitHub](https://github.com/gvergnaud/ts-pattern#poptional-patterns)
 *
 * @example
 *  match(value)
 *   .with({ greeting: P.optional('Hello') }, () => 'will match { greeting?: "Hello" }')
 */
export function optional<input, const pattern extends unknown extends input ? UnknownPattern : Pattern<input>>(
	pattern: pattern,
): Chainable<OptionalP<input, pattern>, "optional"> {
	return chainable({
		[matcher]() {
			return {
				match: <UnknownInput>(value: UnknownInput | input) => {
					let selections: Record<string, unknown[]> = {};
					const selector = (key: string, value: any) => {
						selections[key] = value;
					};
					if (value === undefined) {
						getSelectionKeys(pattern).forEach((key) => selector(key, undefined));
						return { matched: true, selections };
					}
					const matched = matchPattern(pattern, value, selector);
					return { matched, selections };
				},
				getSelectionKeys: () => getSelectionKeys(pattern),
				matcherType: "optional",
			};
		},
	});
}

type UnwrapArray<xs> = xs extends readonly (infer x)[] ? x : never;

type UnwrapSet<xs> = xs extends Set<infer x> ? x : never;

type UnwrapMapKey<xs> = xs extends Map<infer k, any> ? k : never;

type UnwrapMapValue<xs> = xs extends Map<any, infer v> ? v : never;

type WithDefault<a, b> = [a] extends [never] ? b : a;

/**
 * `P.array(subpattern)` takes a sub pattern and returns a pattern, which matches
 * arrays if all their elements match the sub pattern.
 *
 * [Read the documentation for `P.array` on GitHub](https://github.com/gvergnaud/ts-pattern#parray-patterns)
 *
 * @example
 *  match(value)
 *   .with({ users: P.array({ name: P.string_ }) }, () => 'will match { name: string }[]')
 */
export function array<input>(): ArrayChainable<ArrayP<input, unknown>>;
export function array<input, const pattern extends Pattern<WithDefault<UnwrapArray<input>, unknown>>>(
	pattern: pattern,
): ArrayChainable<ArrayP<input, pattern>>;
export function array(...args: [pattern?: unknown]): ArrayChainable<ArrayP<any, any>> {
	return arrayChainable({
		[matcher]() {
			return {
				match: (value: unknown) => {
					if (!isArray(value)) return { matched: false };

					if (args.size() === 0) return { matched: true };

					const pattern = args[0];
					let selections: Record<string, unknown[]> = {};

					if (value.size() === 0) {
						getSelectionKeys(pattern).forEach((key) => {
							selections[key] = [];
						});
						return { matched: true, selections };
					}

					const selector = (key: string, value: unknown) => {
						selections[key] = concat(selections[key] || [], [value]);
					};

					const matched = (value as defined[]).every((v) => matchPattern(pattern, v, selector));

					return { matched, selections };
				},
				getSelectionKeys: () => (args.size() === 0 ? [] : getSelectionKeys(args[0])),
			};
		},
	});
}

/**
 * `P.set(subpattern)` takes a sub pattern and returns a pattern that matches
 * sets if all their elements match the sub pattern.
 *
 * [Read `P.set` documentation on GitHub](https://github.com/gvergnaud/ts-pattern#pset-patterns)
 *
 * @example
 *  match(value)
 *   .with({ users: P.set(P.string_) }, () => 'will match Set<string>')
 */
export function set<input>(): Chainable<SetP<input, unknown>>;
export function set<input, const pattern extends Pattern<WithDefault<UnwrapSet<input>, unknown>>>(
	pattern: pattern,
): Chainable<SetP<input, pattern>>;
export function set<input, const pattern extends Pattern<WithDefault<UnwrapSet<input>, unknown>>>(
	...args: [pattern?: pattern]
): Chainable<SetP<input, pattern>> {
	return chainable({
		[matcher]() {
			return {
				match: <UnknownInput>(value: UnknownInput | input) => {
					if (!isSet(value)) return { matched: false };

					let selections: Record<string, unknown[]> = {};

					if (value.size() === 0) {
						return { matched: true, selections };
					}

					if (args.size() === 0) return { matched: true };

					const selector = (key: string, value: unknown) => {
						selections[key] = concat(selections[key] || [], [value]);
					};

					const pattern = args[0];

					const matched = setEvery(value as unknown as Set<unknown>, (v) => matchPattern(pattern, v, selector));

					return { matched, selections };
				},
				getSelectionKeys: () => (args.size() === 0 ? [] : getSelectionKeys(args[0])),
			};
		},
	});
}

const setEvery = <T>(set: Set<T>, predicate: (value: T) => boolean) => {
	for (const value of set) {
		if (predicate(value)) continue;
		return false;
	}
	return true;
};

/**
 * `P.map(keyPattern, valuePattern)` takes a subpattern to match against the
 * key, a subpattern to match against the value and returns a pattern that
 * matches on maps where all elements inside the map match those two
 * subpatterns.
 *
 * [Read `P.map` documentation on GitHub](https://github.com/gvergnaud/ts-pattern#pmap-patterns)
 *
 * @example
 *  match(value)
 *   .with({ users: P.map(P.map(P.string_, P.number)) }, (map) => `map's type is Map<string, number>`)
 */
export function map<input>(): Chainable<MapP<input, unknown, unknown>>;
export function map<
	input,
	const pkey extends Pattern<WithDefault<UnwrapMapKey<input>, unknown>>,
	const pvalue extends Pattern<WithDefault<UnwrapMapValue<input>, unknown>>,
>(patternKey: pkey, patternValue: pvalue): Chainable<MapP<input, pkey, pvalue>>;
export function map<
	input,
	const pkey extends Pattern<WithDefault<UnwrapMapKey<input>, unknown>>,
	const pvalue extends Pattern<WithDefault<UnwrapMapValue<input>, unknown>>,
>(...args: [patternKey?: pkey, patternValue?: pvalue]): Chainable<MapP<input, pkey, pvalue>> {
	return chainable({
		[matcher]() {
			return {
				match: <UnknownInput>(value: UnknownInput | input) => {
					if (!isMap(value)) return { matched: false };

					let selections: Record<string, unknown[]> = {};

					if (value.size() === 0) {
						return { matched: true, selections };
					}

					const selector = (key: string, value: unknown) => {
						selections[key] = concat(selections[key] || [], [value]);
					};

					if (args.size() === 0) return { matched: true };
					if (args.size() === 1) {
						error(`\`P.map\` wasn\'t given enough arguments. Expected (key, value), received ${tostring(args[0])}`);
					}
					const [patternKey, patternValue] = args;

					const matched = mapEvery(value as unknown as Map<unknown, unknown>, (v, k) => {
						const keyMatch = matchPattern(patternKey, k, selector);
						const valueMatch = matchPattern(patternValue, v, selector);
						return keyMatch && valueMatch;
					});

					return { matched, selections };
				},
				getSelectionKeys: () => (args.size() === 0 ? [] : [...getSelectionKeys(args[0]), ...getSelectionKeys(args[1])]),
			};
		},
	});
}

const mapEvery = <K, T>(map: Map<K, T>, predicate: (value: T, key: K) => boolean) => {
	for (const [key, value] of entries(map)) {
		if (predicate(value, key)) continue;
		return false;
	}
	return true;
};

/**
 * `P.intersection(...patterns)` returns a pattern which matches
 * only if **every** patterns provided in parameter match the input.
 *
 * [Read the documentation for `P.intersection` on GitHub](https://github.com/gvergnaud/ts-pattern#pintersection-patterns)
 *
 * @example
 *  match(value)
 *   .with(
 *     {
 *       user: P.intersection(
 *         { firstname: P.string_ },
 *         { lastname: P.string_ },
 *         { age: P.when(age => age > 21) }
 *       )
 *     },
 *     ({ user }) => 'will match { firstname: string, lastname: string, age: number } if age > 21'
 *   )
 */
export function intersection<input, const patterns extends readonly [Pattern<input>, ...Pattern<input>[]]>(
	...patterns: patterns
): Chainable<AndP<input, patterns>> {
	return chainable({
		[matcher]: () => ({
			match: (value: unknown) => {
				let selections: Record<string, unknown[]> = {};
				const selector = (key: string, value: any) => {
					selections[key] = value;
				};
				//UnknownPattern
				const matched = (patterns as readonly defined[]).every((p) => matchPattern(p, value, selector));
				return { matched, selections };
			},
			getSelectionKeys: () => flatMap(patterns as readonly UnknownPattern[], getSelectionKeys),
			matcherType: "and",
		}),
	});
}

/**
 * `P.union(...patterns)` returns a pattern which matches
 * if **at least one** of the patterns provided in parameter match the input.
 *
 * [Read the documentation for `P.union` on GitHub](https://github.com/gvergnaud/ts-pattern#punion-patterns)
 *
 * @example
 *  match(value)
 *   .with(
 *     { type: P.union('a', 'b', 'c') },
 *     ({ type }) => 'will match { type: "a" | "b" | "c" }'
 *   )
 */
export function union<input, const patterns extends readonly [Pattern<input>, ...Pattern<input>[]]>(
	...patterns: patterns
): Chainable<OrP<input, patterns>> {
	return chainable({
		[matcher]: () => ({
			match: <UnknownInput>(value: UnknownInput | input) => {
				let selections: Record<string, unknown[]> = {};
				const selector = (key: string, value: any) => {
					selections[key] = value;
				};
				flatMap(patterns as readonly UnknownPattern[], getSelectionKeys).forEach((key) => selector(key, undefined));
				// UnknownPattern
				const matched = (patterns as readonly defined[]).some((p) => matchPattern(p, value, selector));
				return { matched, selections };
			},
			getSelectionKeys: () => flatMap(patterns as readonly UnknownPattern[], getSelectionKeys),
			matcherType: "or",
		}),
	});
}

/**
 * `P.not_(pattern)` returns a pattern which matches if the sub pattern
 * doesn't match.
 *
 * [Read the documentation for `P.not` on GitHub](https://github.com/gvergnaud/ts-pattern#pnot-patterns)
 *
 * @example
 *  match<{ a: string | number }>(value)
 *   .with({ a: P.not_(P.string_) }, (x) => 'will match { a: number }'
 *   )
 */

export function not_<input, const pattern extends Pattern<input> | UnknownPattern>(
	pattern: pattern,
): Chainable<NotP<input, pattern>> {
	return chainable({
		[matcher]: () => ({
			match: <UnknownInput>(value: UnknownInput | input) => ({
				matched: !matchPattern(pattern, value, () => {}),
			}),
			getSelectionKeys: () => [],
			matcherType: "not",
		}),
	});
}

/**
 * `P.when((value) => boolean)` returns a pattern which matches
 * if the predicate returns true for the current input.
 *
 * [Read the documentation for `P.when` on GitHub](https://github.com/gvergnaud/ts-pattern#pwhen-patterns)
 *
 * @example
 *  match<{ age: number }>(value)
 *   .with({ age: P.when(age => age > 21) }, (x) => 'will match if value.age > 21'
 *   )
 */
export function when<input, predicate extends (value: input) => unknown>(
	predicate: predicate,
): GuardP<input, predicate extends (value: any) => value is infer narrowed ? narrowed : never>;
export function when<input, narrowed extends input, excluded>(
	predicate: (input: input) => input is narrowed,
): GuardExcludeP<input, narrowed, excluded>;
export function when<input, predicate extends (value: input) => unknown>(
	predicate: predicate,
): GuardP<input, predicate extends (value: any) => value is infer narrowed ? narrowed : never> {
	return {
		[matcher]() {
			return {
				match: <UnknownInput>(value: UnknownInput | input) => ({
					matched: !!predicate(value as input),
				}),
			};
		},
	};
}

/**
 * `P.select_()` is a pattern which will always match,
 * and will inject the selected piece of input in the handler function.
 *
 * [Read the documentation for `P.select_` on GitHub](https://github.com/gvergnaud/ts-pattern#pselect-patterns)
 *
 * @example
 *  match<{ age: number }>(value)
 *   .with({ age: P.select_() }, (age) => 'age: number'
 *   )
 */
export function select_(): Chainable<AnonymousSelectP, "select" | "or" | "and">;
export function select_<
	input,
	const patternOrKey extends string | (unknown extends input ? UnknownPattern : Pattern<input>),
>(
	patternOrKey: patternOrKey,
): patternOrKey extends string
	? Chainable<SelectP<patternOrKey, "select" | "or" | "and">>
	: Chainable<SelectP<symbols.anonymousSelectKey, input, patternOrKey>, "select" | "or" | "and">;
export function select_<
	input,
	const pattern extends unknown extends input ? UnknownPattern : Pattern<input>,
	const k extends string,
>(key: k, pattern: pattern): Chainable<SelectP<k, input, pattern>, "select" | "or" | "and">;
export function select_(
	...args: [keyOrPattern?: unknown | string, pattern?: unknown]
): Chainable<SelectP<string>, "select" | "or" | "and"> {
	const key: string | undefined = typeIs(args[0], "string") ? args[0] : undefined;
	const pattern: unknown = args.size() === 2 ? args[1] : typeIs(args[0], "string") ? undefined : args[0];
	return chainable({
		[matcher]() {
			return {
				match: (value) => {
					let selections: Record<string, unknown> = {
						[key ?? symbols.anonymousSelectKey]: value,
					};
					const selector = (key: string, value: any) => {
						selections[key] = value;
					};
					return {
						matched: pattern === undefined ? true : matchPattern(pattern, value, selector),
						selections: selections,
					};
				},
				getSelectionKeys: () =>
					concat([key ?? symbols.anonymousSelectKey], pattern === undefined ? [] : getSelectionKeys(pattern)),
			};
		},
	});
}

function isUnknown(x: unknown): x is unknown {
	return true;
}

function isNumber<T>(x: T | number): x is number {
	return typeIs(x, "number");
}

function isString<T>(x: T | string): x is string {
	return typeIs(x, "string");
}

function isBoolean<T>(x: T | boolean): x is boolean {
	return typeIs(x, "boolean");
}

function isNullish<T>(x: T | undefined): x is undefined {
	return x === undefined;
}

function isNonNullable(x: unknown): x is {} {
	return x !== undefined;
}

type AnyConstructor = abstract new (...args: any[]) => any;

function isInstanceOf<T extends AnyConstructor>(classConstructor: T) {
	return (val: unknown): val is InstanceType<T> => val instanceof classConstructor;
}

/**
 * `P.any` is a wildcard pattern, matching **any value**.
 *
 * [Read the documentation for `P.any` on GitHub](https://github.com/gvergnaud/ts-pattern#p_-wildcard)
 *
 * @example
 *  match(value)
 *   .with(P.any, () => 'will always match')
 */
export const any: AnyPattern = chainable(when(isUnknown));

/**
 * `P._` is a wildcard pattern, matching **any value**.
 * It's an alias to `P.any`.
 *
 * [Read the documentation for `P._` on GitHub](https://github.com/gvergnaud/ts-pattern#p_-wildcard)
 *
 * @example
 *  match(value)
 *   .with(P._, () => 'will always match')
 */
export const _ = any;

/**
 * `P.string_.startsWith(start)` is a pattern, matching **strings** starting with `start`.
 *
 * [Read the documentation for `P.string_.startsWith` on GitHub](https://github.com/gvergnaud/ts-pattern#pstringstartsWith)
 *
 * @example
 *  match(value)
 *   .with(P.string_.startsWith('A'), () => 'value starts with an A')
 */

const startsWith = <input, const start extends string>(start: start): GuardP<input, `${start}${string}`> =>
	when((value) => isString(value) && String.startsWith(value, start));

/**
 * `P.string_.endsWith(end)` is a pattern, matching **strings** ending with `end`.
 *
 * [Read the documentation for `P.string_.endsWith` on GitHub](https://github.com/gvergnaud/ts-pattern#pstringendsWith)
 *
 * @example
 *  match(value)
 *   .with(P.string_.endsWith('!'), () => 'value ends with an !')
 */
const endsWith = <input, const end extends string>(end_: end): GuardP<input, `${string}${end}`> =>
	when((value) => isString(value) && String.endsWith(value, end_));

/**
 * `P.string_.minLength(min)` is a pattern, matching **strings** with at least `min` characters.
 *
 * [Read the documentation for `P.string_.minLength` on GitHub](https://github.com/gvergnaud/ts-pattern#pstringminLength)
 *
 * @example
 *  match(value)
 *   .with(P.string_.minLength(10), () => 'string with more length >= 10')
 */
const minLength = <const min extends number>(min: min) => when((value) => isString(value) && value.size() >= min);

/**
 * `P.string_.length(len)` is a pattern, matching **strings** with exactly `len` characters.
 *
 * [Read the documentation for `P.string_.length` on GitHub](https://github.com/gvergnaud/ts-pattern#pstringlength)
 *
 * @example
 *  match(value)
 *   .with(P.string_.length(10), () => 'strings with length === 10')
 */
const length = <const len extends number>(len: len) => when((value) => isString(value) && value.size() === len);

/**
 * `P.string_.maxLength(max)` is a pattern, matching **strings** with at most `max` characters.
 *
 * [Read the documentation for `P.string_.maxLength` on GitHub](https://github.com/gvergnaud/ts-pattern#pstringmaxLength)
 *
 * @example
 *  match(value)
 *   .with(P.string_.maxLength(10), () => 'string with more length <= 10')
 */
const maxLength = <const max extends number>(max: max) => when((value) => isString(value) && value.size() <= max);

/**
 * `P.string_.includes(substr)` is a pattern, matching **strings** containing `substr`.
 *
 * [Read the documentation for `P.string_.includes` on GitHub](https://github.com/gvergnaud/ts-pattern#pstringincludes)
 *
 * @example
 *  match(value)
 *   .with(P.string_.includes('http'), () => 'value contains http')
 */
const includes = <input, const substr extends string>(substr: substr): GuardExcludeP<input, string, never> =>
	when((value) => isString(value) && /*value.includes(substr)*/ value.match(substr)[0] !== undefined);

/**
 * `P.string_.regex(expr)` is a pattern, matching **strings** that `expr` regular expression.
 *
 * [Read the documentation for `P.string_.regex` on GitHub](https://github.com/gvergnaud/ts-pattern#pstringregex)
 *
 * @example
 *  match(value)
 *   .with(P.string_.regex(/^https?:\/\//), () => 'url')
 */
const regex = <input, const expr extends string>(expr: expr): GuardExcludeP<input, string, never> =>
	when((value) => isString(value) && value.match(expr)[0] !== undefined);

const stringChainable = <pattern extends Matcher<any, any, any, any, any>>(
	pattern: pattern,
): StringChainable<pattern> =>
	assign(chainable(pattern), {
		startsWith: (str: string) => stringChainable(intersection(pattern, startsWith(str))),
		endsWith: (str: string) => stringChainable(intersection(pattern, endsWith(str))),
		minLength: (min: number) => stringChainable(intersection(pattern, minLength(min))),
		length: (len: number) => stringChainable(intersection(pattern, length(len))),
		maxLength: (max: number) => stringChainable(intersection(pattern, maxLength(max))),
		includes: (str: string) => stringChainable(intersection(pattern, includes(str))),
		regex: (str: string) => stringChainable(intersection(pattern, regex(str))),
	}) as any;

/**
 * `P.string_` is a wildcard pattern, matching any **string**.
 *
 * [Read the documentation for `P.string_` on GitHub](https://github.com/gvergnaud/ts-pattern#pstring-wildcard)
 *
 * @example
 *  match(value)
 *   .with(P.string_, () => 'will match on strings')
 */
export const string_: StringPattern = stringChainable(when(isString));

/**
 * `P.number.between(min, max)` matches **numbers** between `min` and `max`,
 * equal to min or equal to max.
 *
 * [Read the documentation for `P.number.between` on GitHub](https://github.com/gvergnaud/ts-pattern#pnumberbetween)
 *
 * @example
 *  match(value)
 *   .with(P.number.between(0, 10), () => '0 <= numbers <= 10')
 */
const between = <input, const min extends number, const max extends number>(
	min: min,
	max: max,
): GuardExcludeP<input, number, never> => when((value) => isNumber(value) && min <= value && max >= value);

/**
 * `P.number.lt(max)` matches **numbers** smaller than `max`.
 *
 * [Read the documentation for `P.number.lt` on GitHub](https://github.com/gvergnaud/ts-pattern#pnumberlt)
 *
 * @example
 *  match(value)
 *   .with(P.number.lt(10), () => 'numbers < 10')
 */
const lt = <input, const max extends number>(max: max): GuardExcludeP<input, number, never> =>
	when((value) => isNumber(value) && value < max);

/**
 * `P.number.gt(min)` matches **numbers** greater than `min`.
 *
 * [Read the documentation for `P.number.gt` on GitHub](https://github.com/gvergnaud/ts-pattern#pnumbergt)
 *
 * @example
 *  match(value)
 *   .with(P.number.gt(10), () => 'numbers > 10')
 */
const gt = <input, const min extends number>(min: min): GuardExcludeP<input, number, never> =>
	when((value) => isNumber(value) && value > min);

/**
 * `P.number.lte(max)` matches **numbers** smaller than or equal to `max`.
 *
 * [Read the documentation for `P.number.lte` on GitHub](https://github.com/gvergnaud/ts-pattern#pnumberlte)
 *
 * @example
 *  match(value)
 *   .with(P.number.lte(10), () => 'numbers <= 10')
 */
const lte = <input, const max extends number>(max: max): GuardExcludeP<input, number, never> =>
	when((value) => isNumber(value) && value <= max);

/**
 * `P.number.gte(min)` matches **numbers** greater than or equal to `min`.
 *
 * [Read the documentation for `P.number.gte` on GitHub](https://github.com/gvergnaud/ts-pattern#pnumbergte)
 *
 * @example
 *  match(value)
 *   .with(P.number.gte(10), () => 'numbers >= 10')
 */
const gte = <input, const min extends number>(min: min): GuardExcludeP<input, number, never> =>
	when((value) => isNumber(value) && value >= min);

/**
 * `P.number.int()` matches **integer** numbers.
 *
 * [Read the documentation for `P.number.int()` on GitHub](https://github.com/gvergnaud/ts-pattern#pnumberint)
 *
 * @example
 *  match(value)
 *   .with(P.number.int(), () => 'an integer')
 */
const int = <input>(): GuardExcludeP<input, number, never> => when((value) => isNumber(value) && isInteger(value));

/**
 * `P.number.finite` matches **finite numbers**.
 *
 * [Read the documentation for `P.number.finite` on GitHub](https://github.com/gvergnaud/ts-pattern#pnumberfinite)
 *
 * @example
 *  match(value)
 *   .with(P.number.finite, () => 'not Infinity')
 */
const finite = <input>(): GuardExcludeP<input, number, never> => when((value) => isNumber(value) && isFinite(value));

/**
 * `P.number.positive()` matches **positive** numbers.
 *
 * [Read the documentation for `P.number.positive()` on GitHub](https://github.com/gvergnaud/ts-pattern#pnumberpositive)
 *
 * @example
 *  match(value)
 *   .with(P.number.positive(), () => 'number > 0')
 */
const positive = <input>(): GuardExcludeP<input, number, never> => when((value) => isNumber(value) && value > 0);

/**
 * `P.number.negative()` matches **negative** numbers.
 *
 * [Read the documentation for `P.number.negative()` on GitHub](https://github.com/gvergnaud/ts-pattern#pnumbernegative)
 *
 * @example
 *  match(value)
 *   .with(P.number.negative(), () => 'number < 0')
 */
const negative = <input>(): GuardExcludeP<input, number, never> => when((value) => isNumber(value) && value < 0);

const numberChainable = <pattern extends Matcher<any, any, any, any, any>>(
	pattern: pattern,
): NumberChainable<pattern> =>
	assign(chainable(pattern), {
		between: (min: number, max: number) => numberChainable(intersection(pattern, between(min, max))),
		lt: (max: number) => numberChainable(intersection(pattern, lt(max))),
		gt: (min: number) => numberChainable(intersection(pattern, gt(min))),
		lte: (max: number) => numberChainable(intersection(pattern, lte(max))),
		gte: (min: number) => numberChainable(intersection(pattern, gte(min))),
		int: () => numberChainable(intersection(pattern, int())),
		finite: () => numberChainable(intersection(pattern, finite())),
		positive: () => numberChainable(intersection(pattern, positive())),
		negative: () => numberChainable(intersection(pattern, negative())),
	}) as any;

/**
 * `P.number` is a wildcard pattern, matching any **number**.
 *
 * [Read the documentation for `P.number` on GitHub](https://github.com/gvergnaud/ts-pattern#pnumber-wildcard)
 *
 * @example
 *  match(value)
 *   .with(P.number, () => 'will match on numbers')
 */
export const number: NumberPattern = numberChainable(when(isNumber));

/**
 * `P.boolean` is a wildcard pattern, matching any **boolean**.
 *
 * [Read the documentation for `P.boolean` on GitHub](https://github.com/gvergnaud/ts-pattern#boolean-wildcard)
 *
 * @example
 *   .with(P.boolean, () => 'will match on booleans')
 */
export const boolean: BooleanPattern = chainable(when(isBoolean));

/**
 * `P.nullish` is a wildcard pattern, matching **null** or **undefined**.
 *
 * [Read the documentation for `P.nullish` on GitHub](https://github.com/gvergnaud/ts-pattern#nullish-wildcard)
 *
 * @example
 *   .with(P.nullish, (x) => `${x} is null or undefined`)
 */
export const nullish: NullishPattern = chainable(when(isNullish));

/**
 * `P.nonNullable` is a wildcard pattern, matching everything except **null** or **undefined**.
 *
 * [Read the documentation for `P.nonNullable` on GitHub](https://github.com/gvergnaud/ts-pattern#nonNullable-wildcard)
 *
 * @example
 *   .with(P.nonNullable, (x) => `${x} isn't null nor undefined`)
 */
export const nonNullable: NonNullablePattern = chainable(when(isNonNullable));

/**
 * `P.instanceOf(SomeClass)` is a pattern matching instances of a given class.
 *
 * [Read the documentation for `P.instanceOf` on GitHub](https://github.com/gvergnaud/ts-pattern#pinstanceof-patterns)
 *
 *  @example
 *   .with(P.instanceOf(SomeClass), () => 'will match on SomeClass instances')
 */
export function instanceOf<T extends AnyConstructor>(classConstructor: T): Chainable<GuardP<unknown, InstanceType<T>>> {
	return chainable(when(isInstanceOf(classConstructor)));
}

/**
 * `P.shape(somePattern)` lets you call methods like `.optional()`, `.and`, `.or` and `.select()`
 * On structural patterns, like objects and arrays.
 *
 * [Read the documentation for `P.shape` on GitHub](https://github.com/gvergnaud/ts-pattern#pshape-patterns)
 *
 *  @example
 *   .with(
 *     {
 *       state: P.shape({ status: "success" }).optional().select()
 *     },
 *     (state) => 'match the success state, or undefined.'
 *   )
 */
export function shape<input, const pattern extends Pattern<input>>(
	pattern: pattern,
): Chainable<GuardP<input, InvertPattern<pattern, input>>>;
export function shape(pattern: UnknownPattern) {
	return chainable(when(isMatching(pattern)));
}
