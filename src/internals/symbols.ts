/**
 * Symbols used internally within ts-pattern to construct and discriminate
 * Guard, Not, and Select, and AnonymousSelect patterns
 *
 * Symbols have the advantage of not appearing in auto-complete suggestions in
 * user defined patterns, and eliminate the risk of property
 * overlap between ts-pattern internals and user defined patterns.
 *
 * These symbols have to be visible to tsc for type inference to work, but
 * users should not import them
 * @module
 * @private
 * @internal
 */

export const matcher: unique symbol = {} as any;
export type matcher = typeof matcher;

export const unset: unique symbol = {} as any;
export type unset = typeof unset;

export const isVariadic: unique symbol = {} as any;
export type isVariadic = typeof isVariadic;

// can't be a symbol because this key has to be enumerable.
export const anonymousSelectKey = "@ts-pattern/anonymous-select-key";
export type anonymousSelectKey = typeof anonymousSelectKey;

export const override: unique symbol = {} as any;
export type override = typeof override;
