import { Expect, Equal } from "../types/helpers";
import { match, P } from "..";
import { Blog } from "./types-catalog/utils";
import { InvertPattern } from "../types/InvertPattern";
import { ExtractPreciseValue } from "../types/ExtractPreciseValue";
import { describe, it, expect } from "@rbxts/jest-globals";
import { NaN } from "@rbxts/phantom/src/Number";

describe("wildcards", () => {
	it("should match String wildcards", () => {
		const res = match<string | number | boolean | undefined>("")
			.with(NaN, () => "")
			.with(P.string_, (x) => {
				type t = Expect<Equal<typeof x, string>>;
				return true;
			})
			.otherwise(() => false);

		expect(res).toEqual(true);
	});

	it("should match Number wildcards", () => {
		const res = match<string | number | boolean | undefined>(2)
			.with(P.number, (x) => {
				type t = Expect<Equal<typeof x, number>>;
				return true;
			})
			.otherwise(() => false);

		expect(res).toEqual(true);
	});

	it("should match Boolean wildcards", () => {
		const res = match<string | number | boolean | undefined>(true)
			.with(P.boolean, (x) => {
				type t = Expect<Equal<typeof x, boolean>>;
				return true;
			})
			.otherwise(() => false);

		expect(res).toEqual(true);
	});

	it("should match nullish wildcard", () => {
		const res = match<string | number | boolean | undefined>(undefined)
			.with(P.nullish, (x) => {
				type t = Expect<Equal<typeof x, undefined>>;
				return true;
			})
			.otherwise(() => false);

		const res2 = match<string | number | boolean | undefined>(undefined)
			.with(P.nullish, (x) => {
				type t = Expect<Equal<typeof x, undefined>>;
				return true;
			})
			.otherwise(() => false);

		expect(res).toEqual(true);
		expect(res2).toEqual(true);
	});

	describe("P.nonNullable", () => {
		it("should narrow primitive types correctly", () => {
			type Input = string | number | boolean | undefined;
			const res = match<Input>(false)
				.with(P.nonNullable, (x) => {
					type t = Expect<Equal<typeof x, string | number | boolean>>;
					return true;
				})
				.otherwise(() => false);

			const res2 = match<0 | 1 | 2>(0)
				.with(P.nonNullable, (x) => {
					type t = Expect<Equal<typeof x, 0 | 1 | 2>>;
					return true;
				})
				.exhaustive();

			expect(res).toEqual(true);
			expect(res2).toEqual(true);
		});

		it("should narrow object types correctly", () => {
			type Input =
				| {
						__typename: "ValidationRejection";
						fields: string[];
				  }
				| {
						__typename: "ValidationRejection";
				  };

			const pattern = {
				__typename: "ValidationRejection",
				fields: P.nonNullable,
			} as const;
			type X = InvertPattern<typeof pattern, Input>;
			type Y = ExtractPreciseValue<Input, X>;

			const fn = (data: Input) =>
				match(data)
					.with({ __typename: "ValidationRejection", fields: P.nonNullable }, ({ fields }) => {
						type t = Expect<Equal<typeof fields, string[]>>;
						return "matched";
					})
					.otherwise(() => "did not match");

			expect(fn({ __typename: "ValidationRejection" })).toBe("did not match");
			expect(fn({ __typename: "ValidationRejection", fields: [] })).toBe("matched");
		});

		it("combined with exhaustive, it should consider all values except null and undefined to be handled", () => {
			const fn1 = (input: string | number | undefined) =>
				match(input)
					.with(P.nonNullable, (x) => {
						type t = Expect<Equal<typeof x, string | number>>;
					})
					.with(P.nullish, () => {})
					// should type-check
					.exhaustive();

			const fn2 = (input: { nested: string | number | undefined }) =>
				match(input)
					.with({ nested: P.nonNullable }, (x) => {
						type t = Expect<Equal<typeof x, { nested: string | number }>>;
					})
					.with({ nested: P.nullish }, (x) => {
						type t = Expect<Equal<typeof x, { nested: undefined }>>;
					})
					// should type-check
					.exhaustive();
		});
	});

	//	it("should match String, Number and Boolean wildcards", () => {
	//		// Will be { id: number, title: string } | { errorMessage: string }
	//		let httpResult = {
	//			id: 20,
	//			title: "hellooo",
	//		}; /* API logic. */
	//
	//		const res = match<any, Blog >(httpResult)
	//			.with({ id: P.number, title: P.string_ }, (r) => ({
	//				id: r.id,
	//				title: r.title,
	//			}))
	//			.with({ errorMessage: P.string_ }, (r) => new Error(r.errorMessage))
	//			.otherwise(() => new Error("Client parse error"));
	//
	//		expect(res).toEqual({
	//			id: 20,
	//			title: "hellooo",
	//		});
	//	});

	it("should infer correctly negated String wildcards", () => {
		const res = match<string | number | boolean>("")
			.with(P.not_(P.string_), (x) => {
				type t = Expect<Equal<typeof x, number | boolean>>;
				return true;
			})
			.otherwise(() => false);

		expect(res).toEqual(false);
	});

	it("should infer correctly negated Number wildcards", () => {
		const res = match<string | number | boolean>(2)
			.with(P.not_(P.number), (x) => {
				type t = Expect<Equal<typeof x, string | boolean>>;
				return true;
			})
			.otherwise(() => false);

		expect(res).toEqual(false);
	});

	it("should infer correctly negated Boolean wildcards", () => {
		const res = match<string | number | boolean>(true)
			.with(P.not_(P.boolean), (x) => {
				type t = Expect<Equal<typeof x, string | number>>;
				return true;
			})
			.otherwise(() => false);

		expect(res).toEqual(false);
	});

	it("when used as an object property pattern, it shouldn't match if the key isn't defined on the object.", () => {
		type Id = { teamId: number } | { storeId: number };

		const selectedId: Id = { teamId: 1 };

		const res = match<Id>(selectedId)
			.with({ storeId: P._ }, () => "storeId")
			.with({ teamId: P._ }, () => "teamId")
			.exhaustive();

		expect(res).toEqual("teamId");
	});

	describe("catch all", () => {
		const allValueTypes = [2, "string", true, () => {}, {}, [], new Map(), new Set()];

		allValueTypes.forEach((value) => {
			it(`should match ${typeOf(value)} values`, () => {
				expect(
					match(value)
						.with(P._, () => "yes")
						.exhaustive(),
				).toEqual("yes");
			});
		});
	});
});
