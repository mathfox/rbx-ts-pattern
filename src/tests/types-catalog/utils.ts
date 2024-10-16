export type Option<a> = { kind: "none" } | { kind: "some"; value: a };

export const none: Option<never> = { kind: "none" };
export const some = <a>(value: a): Option<a> => ({
	kind: "some",
	value,
});

export type Blog = {
	id: number;
	title: string;
};

export type State =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "success"; data: string }
	| { status: "error"; error: object };

export type Event =
	| { type: "fetch" }
	| { type: "success"; data: string; requestTime?: number }
	| { type: "error"; error: object }
	| { type: "cancel" };

export type BigUnion =
	| "a"
	| "b"
	| "c"
	| "d"
	| "e"
	| "f"
	| "g"
	| "h"
	| "i"
	| "j"
	| "k"
	| "l"
	| "m"
	| "n"
	| "o"
	| "p"
	| "q"
	| "r"
	| "s"
	| "t"
	| "u"
	| "v"
	| "w"
	| "x"
	| "y"
	| "z";

type AsyncResultStatus = "idle" | "loading" | "error" | "success";

export interface BaseAsyncResult<TData, TError = object> {
	status: AsyncResultStatus;
	data?: TData;
	error?: TError;
}

export interface AsyncResultIdleOrLoading<TData, TError = object> extends BaseAsyncResult<TData, TError> {
	status: "idle" | "loading";
}

export interface AsyncResultSuccess<TData, TError = object> extends BaseAsyncResult<TData, TError> {
	status: "success";
	data: TData;
}

export interface AsyncResultError<TData, TError = object> extends BaseAsyncResult<TData, TError> {
	status: "error";
	error: TError;
}
export type AsyncResult<TData, TError = object> =
	| AsyncResultIdleOrLoading<TData, TError>
	| AsyncResultSuccess<TData, TError>
	| AsyncResultError<TData, TError>;
