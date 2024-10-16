import { describe, it, expect } from "@rbxts/jest-globals";
import { match } from "..";

describe("otherwise", () => {
	it("should pass matched value to otherwise", () => {
		const result = match<number>(42)
			.with(51, (d) => d)
			.otherwise((d) => d);
		expect(result).toBe(42);
	});
});
