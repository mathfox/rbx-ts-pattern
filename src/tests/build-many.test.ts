import { describe, it } from "@rbxts/jest-globals";
import { BuildMany } from "../types/BuildMany";
import { Equal, Expect } from "../types/helpers";
import { State } from "./types-catalog/utils";

describe("BuildMany", () => {
	it("should correctly update the content of a readonly tuple", () => {
		type cases = [
			Expect<Equal<BuildMany<readonly [number, State], [[{ status: "idle" }, [1]]]>, [number, { status: "idle" }]>>,
			Expect<
				Equal<
					BuildMany<readonly [number, State], [[{ status: "idle" }, [1]]] | [[{ status: "loading" }, [1]]]>,
					[number, { status: "idle" }] | [number, { status: "loading" }]
				>
			>,
		];
	});
});
