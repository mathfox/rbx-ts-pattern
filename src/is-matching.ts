import { MatchedValue, Pattern } from "./types/Pattern";
import * as P from "./patterns";
import { matchPattern } from "./internals/helpers";

/**
 * `isMatching` takes pattern and returns a **type guard** function, cheching if a value matches this pattern.
 *
 * [Read  documentation for `isMatching` on GitHub](https://github.com/gvergnaud/ts-pattern#ismatching)
 *
 * @example
 *  const hasName = isMatching({ name: P.string_ })
 *
 *  declare let input: unknown
 *
 *  if (hasName(input)) {
 *    // `input` inferred as { name: string }
 *    return input.name
 *  }
 */
export function isMatching<const p extends Pattern<unknown>>(pattern: p): (value: unknown) => value is P.infer<p>;
/**
 * `isMatching` takes pattern and a value and checks if the value matches this pattern.
 *
 * [Read  documentation for `isMatching` on GitHub](https://github.com/gvergnaud/ts-pattern#ismatching)
 *
 * @example
 *  declare let input: unknown
 *
 *  if (isMatching({ name: P.string_ }, input)) {
 *    // `input` inferred as { name: string }
 *    return input.name
 *  }
 */
export function isMatching<const p extends Pattern<unknown>>(pattern: p, value: unknown): value is P.infer<p>;

export function isMatching<const p extends Pattern<any>>(
	...args: [pattern: p, value?: unknown]
): boolean | ((_: unknown) => boolean) {
	if (args.size() === 1) {
		const [pattern] = args;
		return (value): value is MatchedValue<any, P.infer<p>> => matchPattern(pattern, value, () => {});
	}
	if (args.size() === 2) {
		const [pattern, value] = args as [(typeof args)[0], unknown];
		return matchPattern(pattern, value, () => {});
	}

	error(`isMatching wasn't given the right number of arguments: expected 1 or 2, received ${args.size()}.`);
}
