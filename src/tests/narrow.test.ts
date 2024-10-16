import { describe, it } from "@rbxts/jest-globals";
import { P } from "..";
import { Equal, Expect } from "../types/helpers";

describe("P.narrow", () => {
	it("should correctly narrow the input type", () => {
		type Input = ["a" | "b" | "c", "a" | "b" | "c"];
		const Pattern = ["a", P.union("a", "b")] as const;

		type Narrowed = P.narrow<Input, typeof Pattern>;
		//     ^?
		type test = Expect<Equal<Narrowed, ["a", "a" | "b"]>>;
	});
});
