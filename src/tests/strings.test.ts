import { describe, it, expect } from "@rbxts/jest-globals";
import { P, match } from "..";
import { Equal, Expect } from "../types/helpers";

describe("Strings", () => {
	//	it(`P.string_.includes('str')`, () => {
	//		const f = (input: string | number) =>
	//			match(input)
	//				.with(P.string_.includes("!!"), (value) => {
	//					type t = Expect<Equal<typeof value, string>>;
	//					return "includes !!";
	//				})
	//				.otherwise((value) => {
	//					type t = Expect<Equal<typeof value, string | number>>;
	//					return "something else";
	//				});
	//
	//		expect(f("hello!!")).toBe("includes !!");
	//		expect(f("nope")).toBe("something else");
	//	});
	//
	//	describe("startsWith", () => {
	//		it(`P.string_.startsWith('str')`, () => {
	//			const f = (input: string | number) =>
	//				match(input)
	//					.with(P.string_.startsWith("hello "), (value) => {
	//						type t = Expect<Equal<typeof value, `hello ${string}`>>;
	//						return "starts with hello";
	//					})
	//					.otherwise((value) => {
	//						type t = Expect<Equal<typeof value, string | number>>;
	//						return "something else";
	//					});
	//
	//			expect(f("hello gabriel")).toBe("starts with hello");
	//			expect(f("gabriel")).toBe("something else");
	//		});
	//
	//		type FileFrom2022 = `2022-${number}-${number}`;
	//		type FileFrom2023 = `2023-${number}-${number}`;
	//
	//		it("should narrow template literal types", () => {
	//			const get = (x: FileFrom2022 | FileFrom2023): string =>
	//				match(x)
	//					.with(P.string_.startsWith("2022-"), (x) => {
	//						type t = Expect<Equal<typeof x, FileFrom2022>>;
	//						return "file from 2022";
	//					})
	//					.with(P.string_.startsWith("2023-"), (x) => {
	//						type t = Expect<Equal<typeof x, FileFrom2023>>;
	//						return "file from 2023";
	//					})
	//					.exhaustive();
	//
	//			expect(get("2022-04-01")).toEqual("file from 2022");
	//			expect(get("2023-04-01")).toEqual("file from 2023");
	//		});
	//
	//		it("should work as a nested pattern", () => {
	//			type Input = { value: FileFrom2022 | FileFrom2023 };
	//
	//			const input: Input = { value: "2023-04-01" };
	//
	//			const output = match<Input>(input)
	//				.with({ value: P.string_.startsWith("2022-") }, (a) => {
	//					type t = Expect<Equal<typeof a, { value: FileFrom2022 }>>;
	//					return "nested file from 2022";
	//				})
	//				.with({ value: P.string_.startsWith("2023-") }, (b) => {
	//					type t = Expect<Equal<typeof b, { value: FileFrom2023 }>>;
	//					return "nested file from 2023";
	//				})
	//				.exhaustive();
	//
	//			expect(output).toEqual("nested file from 2023");
	//		});
	//	});
	//
	//	it(`P.string_.endsWith('str')`, () => {
	//		const f = (input: string | number) =>
	//			match(input)
	//				.with(P.string_.endsWith("!!"), (value) => {
	//					type t = Expect<Equal<typeof value, `${string}!!`>>;
	//					return "ends with !!";
	//				})
	//				.otherwise((value) => {
	//					type t = Expect<Equal<typeof value, string | number>>;
	//					return "something else";
	//				});
	//
	//		expect(f("hello!!")).toBe("ends with !!");
	//		expect(f("nope")).toBe("something else");
	//	});
	//
	//	it(`P.string_.minLength(..)`, () => {
	//		const f = (input: string | number) =>
	//			match(input)
	//				.with(P.string_.minLength(2), (value) => {
	//					type t = Expect<Equal<typeof value, string>>;
	//					return "yes";
	//				})
	//				.otherwise((value) => {
	//					type t = Expect<Equal<typeof value, string | number>>;
	//					return "no";
	//				});
	//
	//		expect(f("aa")).toBe("yes");
	//		expect(f("aaa")).toBe("yes");
	//		expect(f("a")).toBe("no");
	//	});
	//
	//	it(`P.string_.length(..)`, () => {
	//		const f = (input: string | number) =>
	//			match(input)
	//				.with(P.string_.length(2), (value) => {
	//					type t = Expect<Equal<typeof value, string>>;
	//					return "yes";
	//				})
	//				.otherwise((value) => {
	//					type t = Expect<Equal<typeof value, string | number>>;
	//					return "no";
	//				});
	//
	//		expect(f("aa")).toBe("yes");
	//		expect(f("bb")).toBe("yes");
	//		expect(f("aaa")).toBe("no");
	//		expect(f("a")).toBe("no");
	//
	//		const f2 = (input: string | number) =>
	//			match(input)
	//				.with(P.string_.length(2), (value) => {
	//					type t = Expect<Equal<typeof value, string>>;
	//					return "yes";
	//				})
	//				// @ts-expect-error matching on specific length isn't exhaustive.
	//				.exhaustive();
	//	});
	//
	//	it(`P.string_.maxLength(..)`, () => {
	//		const f = (input: string | number) =>
	//			match(input)
	//				.with(P.string_.maxLength(10), (value) => {
	//					type t = Expect<Equal<typeof value, string>>;
	//					return "yes";
	//				})
	//				.otherwise((value) => {
	//					type t = Expect<Equal<typeof value, string | number>>;
	//					return "no";
	//				});
	//
	//		expect(f("aaa")).toBe("yes");
	//		expect(f("aaaaaaaaaa")).toBe("yes");
	//		expect(f("aaaaaaaaaaa")).toBe("no");
	//	});
});
