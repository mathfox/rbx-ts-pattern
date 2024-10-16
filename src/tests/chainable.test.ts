import { describe, it, expect } from "@rbxts/jest-globals";
import { P, match } from "..";
import { Equal, Expect } from "../types/helpers";

//describe("chainable methods", () => {
//	describe("string compositions", () => {
//		it(`P.string_.optional()`, () => {
//			const f = (input?: string | number) =>
//				match(input)
//					.with(P.string_.optional(), (value) => {
//						type t = Expect<Equal<typeof value, string | undefined>>;
//						return `yes ${value}`;
//					})
//					.otherwise((value) => {
//						type t = Expect<Equal<typeof value, number>>;
//						return "no";
//					});
//
//			expect(f(102)).toBe("no");
//			expect(f()).toBe("yes undefined");
//			expect(f("gabriel")).toBe("yes gabriel");
//		});
//
//		it(`P.string_.select()`, () => {
//			const f = (input?: string | number) =>
//				match({ input })
//					.with({ input: P.string_.select() }, (value) => {
//						type t = Expect<Equal<typeof value, string>>;
//						return `yes ${value}`;
//					})
//					.otherwise(() => "no");
//
//			expect(f(102)).toBe("no");
//			expect(f()).toBe("no");
//			expect(f("gabriel")).toBe("yes gabriel");
//		});
//		it(`P.number.optional.select()`, () => {
//			const f = (input?: string | number) =>
//				match({ input })
//					.with({ input: P.number.optional().select() }, (value) => {
//						type t = Expect<Equal<typeof value, number | undefined>>;
//						return `yes ${value}`;
//					})
//					.otherwise(() => "no");
//
//			expect(f(102)).toBe("yes 102");
//			expect(f()).toBe("yes undefined");
//			expect(f("gabriel")).toBe("no");
//		});
//		it(`P.string_.optional.select()`, () => {
//			const f = (input?: string | number) =>
//				match({ input })
//					.with({ input: P.string_.optional().select() }, (value) => {
//						type t = Expect<Equal<typeof value, string | undefined>>;
//						return `yes ${value}`;
//					})
//					.otherwise(() => "no");
//
//			expect(f(102)).toBe("no");
//			expect(f()).toBe("yes undefined");
//			expect(f("gabriel")).toBe("yes gabriel");
//		});
//		it(`P.string_.startsWith(..).optional().select()`, () => {
//			const f = (input?: string | number) =>
//				match({ input })
//					.with(
//						{
//							input: P.string_.startsWith("hello ").optional().select(),
//						},
//						(value) => {
//							type t = Expect<Equal<typeof value, `hello ${string}` | undefined>>;
//							return `starts with hello: ${value}`;
//						},
//					)
//					.otherwise(() => "no");
//
//			expect(f("hello gabriel")).toBe("starts with hello: hello gabriel");
//			expect(f("gabriel")).toBe("no");
//		});
//
//		it("P.string_.startsWith(..).endsWith(..)", () => {
//			const f = (input?: string | number) =>
//				match(input)
//					.with(P.string_.startsWith("hello ").endsWith("!"), (value) => {
//						type t = Expect<Equal<typeof value, `hello ${string}` & `${string}!`>>;
//						return `yes: ${value}`;
//					})
//					.otherwise(() => "no");
//
//			expect(f("hello gabriel!")).toBe("yes: hello gabriel!");
//			expect(f("hello gabriel")).toBe("no");
//			expect(f("gabriel!")).toBe("no");
//			expect(f("gabriel")).toBe("no");
//		});
//	});
//
//	describe("number compositions", () => {
//		it(`P.number.optional()`, () => {
//			const f = (input?: string | number) =>
//				match(input)
//					.with(P.number.optional(), (value) => {
//						type t = Expect<Equal<typeof value, number | undefined>>;
//						return `yes ${value}`;
//					})
//					.otherwise((value) => {
//						type t = Expect<Equal<typeof value, string>>;
//						return "no";
//					});
//
//			expect(f(102)).toBe("yes 102");
//			expect(f()).toBe("yes undefined");
//			expect(f("gabriel")).toBe("no");
//		});
//
//		it(`P.number.select()`, () => {
//			const f = (input?: string | number) =>
//				match({ input })
//					.with({ input: P.number.select() }, (value) => {
//						type t = Expect<Equal<typeof value, number>>;
//						return `yes ${value}`;
//					})
//					.otherwise(() => "no");
//
//			expect(f(102)).toBe("yes 102");
//			expect(f()).toBe("no");
//			expect(f("gabriel")).toBe("no");
//		});
//
//		it(`P.number.int().positive().finite().between(..).optional().select(),`, () => {
//			const f = (input?: string | number) =>
//				match({ input })
//					.with(
//						{
//							input: P.number.int().positive().finite().between(3, 7).optional().select(),
//						},
//						(value) => {
//							type t = Expect<Equal<typeof value, number | undefined>>;
//							return `yes ${value}`;
//						},
//					)
//					.otherwise(() => "no");
//
//			expect(f(5)).toBe("yes 5");
//			expect(f()).toBe("yes undefined");
//			expect(f(1)).toBe("no");
//			expect(f(8)).toBe("no");
//			expect(f(-2)).toBe("no");
//			expect(f(4.123)).toBe("no");
//			expect(f(math.huge)).toBe("no");
//		});
//	});
//
//	describe("and", () => {
//		it("should infer the intersection of narrowed patterns", () => {
//			const f = (input?: string | number) =>
//				match(input)
//					.with(P.string_.startsWith("hello ").and(P.string_.endsWith("!")), (value) => {
//						type t = Expect<Equal<typeof value, `hello ${string}` & `${string}!`>>;
//						return `yes: ${value}`;
//					})
//					.otherwise(() => "no");
//
//			expect(f("hello gabriel!")).toBe("yes: hello gabriel!");
//			expect(f("hello gabriel")).toBe("no");
//			expect(f("gabriel!")).toBe("no");
//			expect(f("gabriel")).toBe("no");
//		});
//	});
//
//	describe("or", () => {
//		it("should infer the union of narrowed patterns", () => {
//			const f = (input?: string | number) =>
//				match(input)
//					.with(P.string_.startsWith("hello ").or(P.string_.endsWith("!")), (value) => {
//						type t = Expect<Equal<typeof value, `hello ${string}` | `${string}!`>>;
//						return `yes: ${value}`;
//					})
//					.otherwise(() => "no");
//
//			expect(f("hello gabriel!")).toBe("yes: hello gabriel!");
//			expect(f("hello gabriel")).toBe("yes: hello gabriel");
//			expect(f("gabriel!")).toBe("yes: gabriel!");
//			expect(f("gabriel")).toBe("no");
//		});
//	});
//});
