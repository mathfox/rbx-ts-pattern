import { describe, it } from "@rbxts/jest-globals";
import { match, P } from "..";
import { Equal, Expect } from "../types/helpers";
import { State } from "./types-catalog/utils";

describe("output type", () => {
	describe("exhaustive", () => {
		it("should return a single type if they are all compatible", () => {
			const f = (input: number) =>
				match(input)
					.with(1, () => "ok")
					.with(2, () => "test")
					.with(P._, () => "hello")
					.exhaustive();

			type o1 = Expect<Equal<ReturnType<typeof f>, string>>;

			const f2 = (input: number) =>
				match(input)
					.with(1, () => ({ x: "ok" }))
					.with(2, () => ({ x: "test" }))
					.with(P._, () => ({ x: "hello" }))
					.exhaustive();

			type o2 = Expect<Equal<ReturnType<typeof f2>, { x: string }>>;

			const f3 = (input: number) =>
				match(input)
					.with(1, () => [1, 2])
					.with(3, () => [1, 2])
					.with(P._, () => [])
					.exhaustive();

			type o3 = Expect<Equal<ReturnType<typeof f3>, number[]>>;
		});

		it("if the current inferred output is assignable to the new output, just pick the broader one", () => {
			const f1 = (input: number) =>
				match(input)
					.with(1, () => [1, 2])
					.with(P._, () => [1, 2])
					.exhaustive();

			type o1 = Expect<Equal<ReturnType<typeof f1>, number[]>>;
		});

		//		it("It should still be possible specify a precise output type", () => {
		//			const f1 = (input: number) =>
		//				match<number, State>(input)
		//					.with(P._, () => ({ status: "idle" }))
		//					// @ts-expect-error
		//					.with(1, () => [1, 2])
		//					// @ts-expect-error
		//					.with(P._, () => [1, 2, null])
		//					.exhaustive();
		//
		//			type o1 = Expect<Equal<ReturnType<typeof f1>, State>>;
		//		});
	});

	describe("run", () => {
		it("should return a single type if they are all compatible", () => {
			const f = (input: number) =>
				match(input)
					.with(1, () => "ok")
					.with(2, () => "test")
					.with(P._, () => "hello")
					.run();

			type o1 = Expect<Equal<ReturnType<typeof f>, string>>;

			const f2 = (input: number) =>
				match(input)
					.with(1, () => ({ x: "ok" }))
					.with(2, () => ({ x: "test" }))
					.with(P._, () => ({ x: "hello" }))
					.run();

			type o2 = Expect<Equal<ReturnType<typeof f2>, { x: string }>>;

			const f3 = (input: number) =>
				match(input)
					.with(1, () => [1, 2])
					.with(3, () => [1, 2])
					.with(P._, () => [])
					.run();

			type o3 = Expect<Equal<ReturnType<typeof f3>, number[]>>;
		});

		it("if the current inferred output is assignable to the new output, just pick the broader one", () => {
			const f1 = (input: number) =>
				match(input)
					.with(1, () => [1, 2])
					.with(P._, () => [1, 2])
					.run();

			type o1 = Expect<Equal<ReturnType<typeof f1>, number[]>>;
		});

		//		it("It should still be possible specify a precise output type", () => {
		//			const f1 = (input: number) =>
		//				match<number, State>(input)
		//					.with(P._, () => ({ status: "idle" }))
		//					// @ts-expect-error
		//					.with(1, () => [1, 2])
		//					// @ts-expect-error
		//					.with(P._, () => [1, 2, null])
		//					.run();
		//
		//			type o1 = Expect<Equal<ReturnType<typeof f1>, State>>;
		//		});
	});

	describe("otherwise", () => {
		it("should return a single type if they are all compatible", () => {
			const f = (input: number) =>
				match(input)
					.with(1, () => "ok")
					.with(2, () => "test")
					.with(P._, () => "hello")
					.otherwise(() => "");

			type o1 = Expect<Equal<ReturnType<typeof f>, string>>;

			const f2 = (input: number) =>
				match(input)
					.with(1, () => ({ x: "ok" }))
					.with(2, () => ({ x: "test" }))
					.with(P._, () => ({ x: "hello" }))
					.otherwise(() => ({ x: "" }));

			type o2 = Expect<Equal<ReturnType<typeof f2>, { x: string }>>;

			const f3 = (input: number) =>
				match(input)
					.with(1, () => [1, 2])
					.with(3, () => [1, 2])
					.with(P._, () => [])
					.otherwise(() => [0]);

			type o3 = Expect<Equal<ReturnType<typeof f3>, number[]>>;
		});

		it("if the current inferred output is assignable to the new output, just pick the broader one", () => {
			const f1 = (input: number) =>
				match(input)
					.with(1, () => [1, 2])
					.with(P._, () => [1, 2])
					.otherwise(() => [0]);

			type o1 = Expect<Equal<ReturnType<typeof f1>, number[]>>;
		});

		//		it("It should still be possible specify a precise output type", () => {
		//			const f1 = (input: number) =>
		//				match<number, State>(input)
		//					.with(P._, () => ({ status: "idle" }))
		//					// @ts-expect-error
		//					.with(1, () => [1, 2])
		//					// @ts-expect-error
		//					.with(P._, () => [1, 2, null])
		//					.otherwise(() => ({ status: "idle" }));
		//
		//			type o1 = Expect<Equal<ReturnType<typeof f1>, State>>;
		//		});
	});
});
