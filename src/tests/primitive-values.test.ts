import { describe, it, expect } from "@rbxts/jest-globals";
import { match, P } from "..";
import { Equal, Expect } from "../types/helpers";

describe("Primitive values", () => {
	it("patterns can be any literal value", () => {
		const x = 2 as unknown;

		expect(
			match(x)
				.with(true, (x) => {
					type t = Expect<Equal<typeof x, true>>;
					return "true";
				})
				.with(false, (x) => {
					type t = Expect<Equal<typeof x, false>>;
					return "false";
				})
				.with(undefined, (x) => {
					type t = Expect<Equal<typeof x, undefined>>;
					return "undefined";
				})
				.with("hello", (x) => {
					type t = Expect<Equal<typeof x, "hello">>;
					return "hello";
				})
				.with(1, (x) => {
					type t = Expect<Equal<typeof x, 1>>;
					return "1";
				})
				.with(2, (x) => {
					type t = Expect<Equal<typeof x, 2>>;
					return "2";
				})
				.otherwise(() => "?"),
		).toEqual("2");
	});

	it("primitive patterns should correctly narrow the value", () => {
		const f = (x: unknown) =>
			match(x)
				.with(P.boolean, (x) => {
					type t = Expect<Equal<typeof x, boolean>>;
					return "boolean";
				})
				.with(P.nullish, (x) => {
					type t = Expect<Equal<typeof x, undefined>>;
					return "nullish";
				})
				.with(P.string_, (x) => {
					type t = Expect<Equal<typeof x, string>>;
					return "string";
				})
				.with(P.number, (x) => {
					type t = Expect<Equal<typeof x, number>>;
					return "number";
				})
				.otherwise(() => "?");

		expect(f(true)).toEqual("boolean");
		expect(f("hello")).toEqual("string");
		expect(f(20)).toEqual("number");
	});
});
