import { describe, it, expect } from "@rbxts/jest-globals";
import { isMatching, P } from "..";
import { Equal, Expect } from "../types/helpers";

describe("isMatching", () => {
	it("should generate a type guard function from a pattern if given a single argument", () => {
		const something: unknown = {
			title: "Hello",
			author: { name: "Gabriel", age: 27 },
		};

		const isBlogPost = isMatching({
			title: P.string_,
			author: { name: P.string_, age: P.number },
		});

		if (isBlogPost(something)) {
			type t = Expect<Equal<typeof something, { title: string; author: { name: string; age: number } }>>;
			expect(true).toBe(true);
		} else {
			error("isMatching should have returned true but it returned false");
		}
	});
	it("should act as a type guard function if given a two arguments", () => {
		const something: unknown = {
			title: "Hello",
			author: { name: "Gabriel", age: 27 },
		};

		if (
			isMatching(
				{
					title: P.string_,
					author: { name: P.string_, age: P.number },
				},
				something,
			)
		) {
			type t = Expect<Equal<typeof something, { title: string; author: { name: string; age: number } }>>;
			expect(true).toBe(true);
		} else {
			error("isMatching should have returned true but it returned false");
		}
	});

	it("type inference should be precise without `as const`", () => {
		type Pizza = { type: "pizza"; topping: string };
		type Sandwich = { type: "sandwich"; condiments: string[] };
		type Food = Pizza | Sandwich;

		const food = { type: "pizza", topping: "cheese" } as Food;

		const isPizza = isMatching({ type: "pizza" });

		if (isPizza(food)) {
			type t = Expect<Equal<typeof food, Pizza>>;
		} else {
			error("Expected food to match the pizza pattern!");
		}

		if (isMatching({ type: "pizza" }, food)) {
			type t = Expect<Equal<typeof food, Pizza>>;
		} else {
			error("Expected food to match the pizza pattern!");
		}
	});
});
