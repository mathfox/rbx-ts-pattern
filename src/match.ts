import { Pattern } from "./types/Pattern";
import { Match } from "./types/Match";
import * as symbols from "./internals/symbols";
import { matchPattern } from "./internals/helpers";
import { slice } from "@rbxts/phantom/src/Array";

type MatchState<output> = { matched: true; value: output } | { matched: false; value: undefined };

const unmatched: MatchState<never> = {
	matched: false,
	value: undefined,
};

/**
 * `match` creates a **pattern matching expression**.
 *  * Use `.with(pattern, handler)` to pattern match on the input.
 *  * Use `.exhaustive()` or `.otherwise(() => defaultValue)` to end the expression and get the result.
 *
 * [Read the documentation for `match` on GitHub](https://github.com/gvergnaud/ts-pattern#match)
 *
 * @example
 *  declare let input: "A" | "B";
 *
 *  return match(input)
 *    .with("A", () => "It's an A!")
 *    .with("B", () => "It's a B!")
 *    .exhaustive();
 *
 */
export function match<const input, output = symbols.unset>(value: input): Match<input, output> {
	return new MatchExpression(value, unmatched) as any;
}

/**
 * This class represents a match expression. It follows the
 * builder pattern, we chain methods to add features to the expression
 * until we call `.exhaustive`, `.otherwise` or the unsafe `.run`
 * method to execute it.
 *
 * The types of this class aren't public, the public type definition
 * can be found in src/types/Match.ts.
 */
class MatchExpression<input, output> {
	constructor(
		private input: input,
		private state: MatchState<output>,
	) {}

	with(...args: unknown[]): MatchExpression<input, output> {
		if (this.state.matched) return this;

		const handler: (selection: unknown, value: input) => output = args[args.size() - 1] as any;

		const patterns: Pattern<input>[] = [args[0] as Pattern<input>];
		let predicate: ((value: input) => unknown) | undefined = undefined;

		if (args.size() === 3 && typeIs(args[1], "function")) {
			// case with guard as second argument
			predicate = args[1];
		} else if (args.size() > 2) {
			// case with several patterns

			for (const item of slice(args, 1, args.size() - 1)) {
				(patterns as defined[]).push(item as defined);
			}
		}

		let hasSelections = false;
		let selected: Record<string, unknown> = {};
		const select_ = (key: string, value: unknown) => {
			hasSelections = true;
			selected[key] = value;
		};

		const matched =
			(patterns as defined[]).some((pattern) => matchPattern(pattern, this.input, select_)) &&
			(predicate ? predicate(this.input) : true);

		const selections = hasSelections
			? symbols.anonymousSelectKey in selected
				? selected[symbols.anonymousSelectKey]
				: selected
			: this.input;

		const state = matched
			? {
					matched: true as const,
					value: handler(selections, this.input),
				}
			: unmatched;

		return new MatchExpression(this.input, state);
	}

	when(
		predicate: (value: input) => unknown,
		handler: (selection: input, value: input) => output,
	): MatchExpression<input, output> {
		if (this.state.matched) return this;

		const matched = predicate(this.input);

		return new MatchExpression<input, output>(
			this.input,
			matched ? { matched: true, value: handler(this.input, this.input) } : unmatched,
		);
	}

	otherwise(handler: (value: input) => output): output {
		if (this.state.matched) return this.state.value;
		return handler(this.input);
	}

	exhaustive(): output {
		if (this.state.matched) return this.state.value;

		/**
		 * Error when the given input value does not match any included pattern
		 * and .exhaustive() was specified
		 */
		error(`Pattern matching error: no pattern matches value ${this.input}`);
	}

	run(): output {
		return this.exhaustive();
	}

	returnType() {
		return this;
	}
}
