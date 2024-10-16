import { Expect, Equal } from "../types/helpers";
import { match, P } from "..";
import { State, Event } from "./types-catalog/utils";
import { MixedNamedAndAnonymousSelectError, SeveralAnonymousSelectError } from "../types/FindSelected";
import { describe, it, expect } from "@rbxts/jest-globals";

describe("select", () => {
	it("should work with tuples", () => {
		expect(
			match<[string, number], number>(["get", 2])
				.with(["get", P.select_("y")], ({ y }) => {
					type t = Expect<Equal<typeof y, number>>;
					return y;
				})
				.run(),
		).toEqual(2);
	});

	it("should work with array", () => {
		expect(
			match<string[], string[]>(["you", "hello"])
				.with([P.select_("first")], ({ first }, xs) => {
					type t = Expect<Equal<typeof xs, [string]>>;
					type t2 = Expect<Equal<typeof first, string>>;
					return [first];
				})
				.with(P.array(P.select_("texts")), ({ texts }, xs) => {
					type t = Expect<Equal<typeof xs, string[]>>;
					type t2 = Expect<Equal<typeof texts, string[]>>;
					return texts;
				})
				.run(),
		).toEqual(["you", "hello"]);

		expect(
			match<{ text: string }[], string[]>([{ text: "you" }, { text: "hello" }])
				.with(P.array({ text: P.select_("texts") }), ({ texts }, xs) => {
					type t = Expect<Equal<typeof xs, { text: string }[]>>;
					type t2 = Expect<Equal<typeof texts, string[]>>;
					return texts;
				})
				.run(),
		).toEqual(["you", "hello"]);

		expect(
			match<{ text: { content: string } }[], string[]>([{ text: { content: "you" } }, { text: { content: "hello" } }])
				.with(P.array({ text: { content: P.select_("texts") } }), ({ texts }, xs) => {
					type t = Expect<Equal<typeof texts, string[]>>;
					return texts;
				})
				.run(),
		).toEqual(["you", "hello"]);
	});

	it("should work with objects", () => {
		expect(
			match<State & { other: number }, string>({
				status: "success",
				data: "some data",
				other: 20,
			})
				.with(
					{
						status: "success",
						data: P.select_("data"),
						other: P.select_("other"),
					},
					({ data, other }) => {
						type t = Expect<Equal<typeof data, string>>;
						type t2 = Expect<Equal<typeof other, number>>;
						return data + tostring(other);
					},
				)
				.run(),
		).toEqual("some data20");
	});

	it("should work with primitive types", () => {
		expect(
			match<string, string>("hello")
				.with(P.select_("x"), ({ x }) => {
					type t = Expect<Equal<typeof x, string>>;
					return x;
				})
				.run(),
		).toEqual("hello");
	});

	it("should work with complex structures", () => {
		const initState: State = {
			status: "idle",
		};

		const reducer = (state: State, event: Event): State =>
			match<[State, Event], State>([state, event])
				.with(
					[
						{ status: "loading" },
						{
							type: "success",
							data: P.select_("data"),
							requestTime: P.select_("time"),
						},
					],
					({ data, time }) => {
						type t = Expect<Equal<typeof time, number | undefined>>;

						return {
							status: "success",
							data,
						};
					},
				)
				.with([{ status: "loading" }, { type: "success", data: P.select_("data") }], ({ data }) => ({
					status: "success",
					data,
				}))
				.with([{ status: "loading" }, { type: "error", error: P.select_("error") }], ({ error: error_ }) => ({
					status: "error",
					error: error_,
				}))
				.with([{ status: "loading" }, { type: "cancel" }], () => initState)
				.with([{ status: P.not_("loading") }, { type: "fetch" }], () => ({
					status: "loading",
				}))
				.with([P.select_("state"), P.select_("event")], ({ state, event }) => {
					type t = Expect<Equal<typeof state, State>>;
					type t2 = Expect<Equal<typeof event, Event>>;
					return state;
				})
				.run();

		expect(reducer(initState, { type: "cancel" })).toEqual(initState);

		expect(reducer(initState, { type: "fetch" })).toEqual({
			status: "loading",
		});

		expect(reducer({ status: "loading" }, { type: "success", data: "yo" })).toEqual({
			status: "success",
			data: "yo",
		});

		expect(reducer({ status: "loading" }, { type: "cancel" })).toEqual({
			status: "idle",
		});
	});

	it("should support nesting of several arrays", () => {
		type Input = [{ name: string }, { post: { title: string }[] }][];
		expect(
			match<Input>([
				[{ name: "Gabriel" }, { post: [{ title: "Hello World" }, { title: "what's up" }] }],
				[{ name: "Alice" }, { post: [{ title: "Hola" }, { title: "coucou" }] }],
			])
				.with([], (x) => {
					type t = Expect<Equal<typeof x, []>>;
					return "empty";
				})
				.with(
					P.array([{ name: P.select_("names") }, { post: P.array({ title: P.select_("titles") }) }]),
					({ names, titles }) => {
						type t = Expect<Equal<typeof names, string[]>>;
						type t2 = Expect<Equal<typeof titles, string[][]>>;

						return (
							names.join(" and ") + " have written " + titles.map((t) => t.map((t) => `"${t}"`).join(", ")).join(", ")
						);
					},
				)
				.exhaustive(),
		).toEqual(`Gabriel and Alice have written "Hello World", "what's up", "Hola", "coucou"`);
	});

	it("Anonymous selections should support nesting of several arrays", () => {
		type Input = [{ name: string }, { post: { title: string }[] }][];
		expect(
			match<Input>([
				[{ name: "Gabriel" }, { post: [{ title: "Hello World" }, { title: "what's up" }] }],
				[{ name: "Alice" }, { post: [{ title: "Hola" }, { title: "coucou" }] }],
			])
				.with([], (x) => {
					type t = Expect<Equal<typeof x, []>>;
					return "empty";
				})
				.with(P.array([{ name: P.any }, { post: P.array({ title: P.select_() }) }]), (titles) => {
					type t1 = Expect<Equal<typeof titles, string[][]>>;
					return titles.map((t) => t.map((t) => `"${t}"`).join(", ")).join(", ");
				})
				.exhaustive(),
		).toEqual(`"Hello World", "what's up", "Hola", "coucou"`);
	});

	it("should infer the selection to an error when using several anonymous selection", () => {
		match({ type: "point", x: 2, y: 3 })
			.with({ type: "point", x: P.select_(), y: P.select_() }, (x) => {
				type t = Expect<Equal<typeof x, SeveralAnonymousSelectError>>;
				return "ok";
			})
			.run();
	});

	it("should infer the selection to an error when using mixed named and unnamed selections", () => {
		match({ type: "point", x: 2, y: 3 })
			.with({ type: "point", x: P.select_(), y: P.select_("y") }, (x) => {
				type t = Expect<Equal<typeof x, MixedNamedAndAnonymousSelectError>>;
				return "ok";
			})
			.run();
	});

	describe("P.select_ with subpattern", () => {
		type Input =
			| {
					type: "a";
					value: { type: "img"; src: string } | { type: "text"; content: string; length: number };
			  }
			| {
					type: "b";
					value: { type: "user"; username: string } | { type: "org"; orgId: number };
			  };

		it("should support only selecting if the value matches a subpattern", () => {
			const f = (input: Input) =>
				match(input)
					.with({ type: "a", value: P.select_({ type: "img" }) }, (x) => {
						type t = Expect<Equal<typeof x, { type: "img"; src: string }>>;
						return x.src;
					})
					.with({ type: "a", value: P.select_("text", { type: "text" }) }, (x) => {
						type t = Expect<Equal<typeof x, { text: { type: "text"; content: string; length: number } }>>;
						return x.text.content;
					})
					.with({ type: "b", value: P.select_({ type: "user" }) }, (x) => {
						type t = Expect<Equal<typeof x, { type: "user"; username: string }>>;
						return x.username;
					})
					.with({ type: "b", value: P.select_("org", { type: "org" }) }, (x) => {
						type t = Expect<Equal<typeof x, { org: { type: "org"; orgId: number } }>>;
						return x.org.orgId;
					})
					.exhaustive();

			expect(f({ type: "a", value: { type: "img", src: "Hello" } })).toEqual("Hello");

			expect(
				f({
					type: "a",
					value: { type: "text", length: 2, content: "some text" },
				}),
			).toEqual("some text");

			expect(f({ type: "b", value: { type: "user", username: "Gabriel" } })).toEqual("Gabriel");

			expect(
				f({
					type: "b",
					value: { type: "org", orgId: 2 },
				}),
			).toEqual(2);
		});

		it("should be possible to nest named selections", () => {
			const f = (input: Input) =>
				match(input)
					.with(
						{
							type: "a",
							value: P.select_("text", {
								type: "text",
								content: P.select_("content"),
								length: P.select_("length"),
							}),
						},
						({ text, content, length }) => {
							type t1 = Expect<Equal<typeof text, { type: "text"; content: string; length: number }>>;
							type t2 = Expect<Equal<typeof content, string>>;
							type t3 = Expect<Equal<typeof length, number>>;
							return [text, length, content];
						},
					)
					.otherwise(() => undefined);

			expect(f({ type: "a", value: { type: "text", length: 2, content: "yo" } })).toEqual([
				{ type: "text", length: 2, content: "yo" },
				2,
				"yo",
			]);

			expect(f({ type: "a", value: { type: "img", src: "yo" } })).toEqual(undefined);
		});

		it("should work with union subpatterns", () => {
			type Input = {
				value: { type: "a"; v: string } | { type: "b"; v: number } | { type: "c"; v: boolean };
			};

			// select directly followed by union
			const f = (input: Input) =>
				match(input)
					.with({ value: P.select_(P.union({ type: "a" }, { type: "b" })) }, (x) => {
						type t = Expect<Equal<typeof x, { type: "a"; v: string } | { type: "b"; v: number }>>;

						return x.v;
					})
					.with({ value: { type: "c" } }, () => "c")
					.exhaustive();

			// select with an object that's a union by union
			const f2 = (input: Input) =>
				match(input)
					.with({ value: P.select_({ type: P.union("a", "b") }) }, (x) => {
						type t = Expect<Equal<typeof x, { type: "a"; v: string } | { type: "b"; v: number }>>;

						return x.v;
					})
					.with({ value: { type: "c" } }, () => "c")
					.exhaustive();

			expect(f({ value: { type: "a", v: "hello" } })).toEqual("hello");
			expect(f2({ value: { type: "a", v: "hello" } })).toEqual("hello");

			expect(f({ value: { type: "b", v: 10 } })).toEqual(10);
			expect(f2({ value: { type: "b", v: 10 } })).toEqual(10);

			expect(f({ value: { type: "c", v: true } })).toEqual("c");
			expect(f2({ value: { type: "c", v: true } })).toEqual("c");
		});

		it("Should work with unions without discriminants", () => {
			type Input =
				| { type: "a"; value: string }
				| { type: "b"; value: number }
				| {
						type: "c";
						value: { type: "d"; value: boolean } | { type: "e"; value: string[] } | { type: "f"; value: number[] };
				  };

			const f = (input: Input) =>
				match(input)
					.with({ type: P.union("a", "b") }, (x) => {
						return "branch 1";
					})
					.with(
						{
							type: "c",
							value: { value: P.select_(P.union(P.boolean, P.array(P.string_))) },
						},
						(x) => {
							type t = Expect<Equal<typeof x, boolean | string[]>>;
							return "branch 2";
						},
					)
					.with({ type: "c", value: { type: "f" } }, () => "branch 3")
					.exhaustive();
		});
	});

	it("Issue #95: P.select_() on empty arrays should return an empty array", () => {
		const res = match<{ a: string[]; b: string[] }>({ a: [], b: ["text"] })
			.with({ a: P.array(P.select_("a")), b: P.array(P.select_("b")) }, ({ a, b }) => {
				type t = Expect<Equal<typeof a, string[]>>;
				type t2 = Expect<Equal<typeof b, string[]>>;
				return { a, b };
			})
			.otherwise(() => undefined);

		expect(res).toEqual({ a: [], b: ["text"] });

		// Should work with deeply nested selections as well
		const res2 = match<{ a: { prop: number }[] }>({ a: [] })
			.with({ a: P.array({ prop: P.select_("a") }) }, ({ a }) => {
				type t = Expect<Equal<typeof a, number[]>>;
				return { a };
			})
			.otherwise(() => undefined);

		expect(res2).toEqual({ a: [] });

		// P.select_ of arrays shouldn't be affected
		const res3 = match<{ a: { prop: number }[] }>({ a: [] })
			.with({ a: P.select_(P.array({ prop: P._ })) }, (a) => {
				type t = Expect<Equal<typeof a, { prop: number }[]>>;
				return { a };
			})
			.otherwise(() => undefined);

		expect(res3).toEqual({ a: [] });
	});

	//	it("should work with variadic tuples", () => {
	//		const fn = (input: string[]) =>
	//			match(input)
	//				.with([P.string_, "some", "cli", "cmd", P.select_(), ...P.array()], (arg) => {
	//					type t = Expect<Equal<typeof arg, string>>;
	//					return arg;
	//				})
	//				.otherwise(() => "2");
	//
	//		expect(fn(["some cli cmd param", "some", "cli", "cmd", "param"])).toEqual("param");
	//		expect(fn(["some cli cmd param --flag", "some", "cli", "cmd", "param", "--flag"])).toEqual("param");
	//	});
});
