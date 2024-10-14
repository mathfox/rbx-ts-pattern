import { Expect, Equal } from "../types/helpers";
import { match, P } from "..";
import { describe, it, expect } from "@rbxts/jest-globals";

class A {
	a = "a";
}
class B {
	b = "b";
}

describe("instanceOf", () => {
	it("should work at the top level", () => {
		const get = (x: A | B): string =>
			match(x)
				.with(P.instanceOf(A), (x) => {
					type t = Expect<Equal<typeof x, A>>;
					return "instance of A";
				})
				.with(P.instanceOf(B), (x) => {
					type t = Expect<Equal<typeof x, B>>;
					return "instance of B";
				})
				.exhaustive();

		expect(get(new A())).toEqual("instance of A");
		expect(get(new B())).toEqual("instance of B");
	});

	it("should work as a nested pattern", () => {
		type Input = { value: A | B };

		const input = { value: new A() };

		const output = match<Input>(input)
			.with({ value: P.instanceOf(A) }, (a) => {
				type t = Expect<Equal<typeof a, { value: A }>>;
				return "instance of A!";
			})
			.with({ value: P.instanceOf(B) }, (b) => {
				type t = Expect<Equal<typeof b, { value: B }>>;
				return "instance of B!";
			})
			.exhaustive();

		expect(output).toEqual("instance of A!");
	});

	//	it("should work with abstract classes", () => {
	//		abstract class Abstract {}
	//
	//		class A extends Abstract {}
	//		class B extends Abstract {}
	//
	//		const get = (x: A | B): string =>
	//			match(x)
	//				.with(P.instanceOf(Abstract), (x) => {
	//					type t = Expect<Equal<typeof x, A | B>>;
	//					return "instance of Abstract";
	//				})
	//				.exhaustive();
	//
	//		expect(get(new A())).toEqual("instance of Abstract");
	//		expect(get(new B())).toEqual("instance of Abstract");
	//	});
});
