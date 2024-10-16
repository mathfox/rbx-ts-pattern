import type { ArrayLength } from "@rbxts/phantom/src/Util/helpers";
import type * as symbols from "../internals/symbols";
import type { AnyMatcher, Matcher, Pattern } from "./Pattern";
import type { Equal, Primitives, ValueOf, MergeUnion, IsUnion } from "./helpers";

type SelectionsRecord = Record<string, [unknown, unknown[]]>;

export type None = {
	type: "none";
};
export type Some<key extends string> = {
	type: "some";
	key: key;
};

export type SelectionType = None | Some<string>;

type MapOptional<selections> = {
	[k in keyof selections]: selections[k] extends [infer v, infer subpath] ? [v | undefined, subpath] : never;
};

type MapList<selections> = {
	[k in keyof selections]: selections[k] extends [infer v, infer subpath] ? [v[], subpath] : never;
};

type ReduceFindSelectionUnion<i, ps extends readonly any[], output = never> = ps extends readonly [
	infer head,
	...infer tail,
]
	? ReduceFindSelectionUnion<i, tail, output | FindSelectionUnion<i, head>>
	: output;

type FindSelectionUnionInArray<i, p, path extends any[] = [], output = never> = i extends readonly (infer iItem)[]
	? p extends readonly []
		? output
		: p extends readonly [infer p1, ...infer pRest]
			? i extends readonly [infer i1, ...infer iRest]
				? FindSelectionUnionInArray<
						iRest,
						pRest,
						[...path, p["length"]],
						output | FindSelectionUnion<i1, p1, [...path, p["length"]]>
					>
				: FindSelectionUnionInArray<
						iItem[],
						pRest,
						[...path, p["length"]],
						output | FindSelectionUnion<iItem, p1, [...path, p["length"]]>
					>
			: p extends readonly [...infer pInit, infer p1]
				? i extends readonly [...infer iInit, infer i1]
					? FindSelectionUnionInArray<
							iInit,
							pInit,
							[...path, p["length"]],
							output | FindSelectionUnion<i1, p1, [...path, p["length"]]>
						>
					: FindSelectionUnionInArray<
							iItem[],
							pInit,
							[...path, p["length"]],
							output | FindSelectionUnion<iItem, p1, [...path, p["length"]]>
						>
				: // If P is a matcher, in this case, it's likely an array matcher
					p extends readonly [...(readonly (infer pRest & AnyMatcher)[])]
					? output | FindSelectionUnion<i, pRest, [...path, ArrayLength<p>]>
					: output | FindSelectionUnion<iItem, ValueOf<p>, [...path, ArrayLength<Extract<p, readonly any[]>>]>
	: output;

export type FindSelectionUnion<
	i,
	p,
	// path just serves as an id, to identify different anonymous patterns which have the same type
	path extends any[] = [],
	// inlining IsAny for perf
> = 0 extends 1 & i
	? never
	: // inlining IsAny for perf
		0 extends 1 & p
		? never
		: p extends Primitives
			? never
			: p extends Matcher<any, infer pattern, infer matcherType, infer sel>
				? {
						select: sel extends Some<infer k> ? { [kk in k]: [i, path] } | FindSelectionUnion<i, pattern, path> : never;
						array: i extends readonly (infer iItem)[] ? MapList<FindSelectionUnion<iItem, pattern>> : never;
						// FIXME: selection for map and set is supported at the value level
						map: never;
						set: never;
						optional: MapOptional<FindSelectionUnion<i, pattern>>;
						or: MapOptional<ReduceFindSelectionUnion<i, Extract<pattern, readonly any[]>>>;
						and: ReduceFindSelectionUnion<i, Extract<pattern, readonly any[]>>;
						not: never;
						default: sel extends Some<infer k> ? { [kk in k]: [i, path] } : never;
						custom: never;
					}[matcherType]
				: p extends readonly any[]
					? FindSelectionUnionInArray<i, p>
					: p extends {}
						? i extends {}
							? {
									[k in keyof p]: k extends keyof i ? FindSelectionUnion<i[k], p[k], [...path, k]> : never;
								}[keyof p]
							: never
						: never;

export type SeveralAnonymousSelectError<
	a = "You can only use a single anonymous selection (with `select()`) in your pattern. If you need to select multiple values, give them names with `select(<name>)` instead",
> = {
	__error: never;
} & a;

export type MixedNamedAndAnonymousSelectError<
	a = 'Mixing named selections (`select("name")`) and anonymous selections (`select()`) is forbiden. Please, only use named selections.',
> = {
	__error: never;
} & a;

export type SelectionToArgs<selections extends SelectionsRecord> = symbols.anonymousSelectKey extends keyof selections
	? // if there are several different paths for anonymous selections
		// it means that P.select_() has been used more than once.
		IsUnion<selections[symbols.anonymousSelectKey][1]> extends true
		? SeveralAnonymousSelectError
		: keyof selections extends symbols.anonymousSelectKey
			? selections[symbols.anonymousSelectKey][0]
			: MixedNamedAndAnonymousSelectError
	: { [k in keyof selections]: selections[k][0] };

export type Selections<i, p> = FindSelectionUnion<i, p> extends infer u
	? [u] extends [never]
		? i
		: SelectionToArgs<Extract<MergeUnion<u>, SelectionsRecord>>
	: i;

export type FindSelected<i, p> =
	// This happens if the provided pattern didn't extend Pattern<i>,
	// Because the type checker falls back on the general `Pattern<i>` type
	// in this case.
	Equal<p, Pattern<i>> extends true ? i : Selections<i, p>;
