/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, vi } from "vitest";

type MethodKeys<T> = {
	[K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T] &
	string;

type UnwrappedReturn<T> = T extends (...args: any[]) => Promise<infer R>
	? R
	: T extends (...args: any[]) => infer R
		? R
		: unknown;

type MockHelpers<T> = {
	[K in MethodKeys<T> as `${K}ShouldReturn`]: (
		val: UnwrappedReturn<Extract<T[K], (...args: any[]) => any>>,
	) => void;
} & {
	[K in MethodKeys<T> as `expect${Capitalize<K>}ToHaveBeenCalledWith`]: (
		...args: Parameters<Extract<T[K], (...args: any[]) => any>>
	) => void;
} & {
	[
		K in MethodKeys<T> as `expect${Capitalize<K>}ToHaveBeenCalled`
	]: () => void;
} & {
	[
		K in MethodKeys<T> as `expect${Capitalize<K>}NotToHaveBeenCalled`
	]: () => void;
};

export type Mocked<T> = T & MockHelpers<T>;

function normalize(value: any): any {
	if (value === null || value === undefined) {
		return value;
	}

	if (typeof value.toPrimitives === "function") {
		return value.toPrimitives();
	}

	if (
		typeof value === "object" &&
		"value" in value &&
		Object.keys(value).length === 1
	) {
		return value.value;
	}

	if (Array.isArray(value)) {
		return value.map(normalize);
	}

	if (typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value).map(([key, val]) => [key, normalize(val)]),
		);
	}

	return value;
}

function argsEqual(actual: any[], expected: any[]): boolean {
	return (
		JSON.stringify(actual.map(normalize)) ===
		JSON.stringify(expected.map(normalize))
	);
}

export class Mock {
	private constructor() {
		throw new Error("Mock is a static class and cannot be instantiated");
	}

	static create<T>(): Mocked<T> {
		const fns = new Map<string, ReturnType<typeof vi.fn>>();

		const fnFor = (name: string): ReturnType<typeof vi.fn> => {
			const existing = fns.get(name);
			if (existing) {
				return existing;
			}

			const fn = vi.fn();
			fns.set(name, fn);

			return fn;
		};

		return new Proxy(
			{},
			{
				get(_target, property: string): unknown {
					if (property.endsWith("ShouldReturn")) {
						const method = property.slice(
							0,
							-"ShouldReturn".length,
						);

						return (value: unknown) =>
							fnFor(method).mockImplementation(() => value);
					}

					const calledWith = property.match(
						/^expect(.+)ToHaveBeenCalledWith$/,
					);
					if (calledWith) {
						const method =
							calledWith[1].charAt(0).toLowerCase() +
							calledWith[1].slice(1);

						return (...expected: any[]) => {
							const calls = fnFor(method).mock.calls;
							const matched = calls.some((call) =>
								argsEqual(call, expected),
							);
							expect(
								matched,
								`Expected ${method} to have been called with ${JSON.stringify(expected.map(normalize))}, got ${JSON.stringify(calls.map((c) => c.map(normalize)))}`,
							).toBe(true);
						};
					}

					const calledNot = property.match(
						/^expect(.+)NotToHaveBeenCalled$/,
					);
					if (calledNot) {
						const method =
							calledNot[1].charAt(0).toLowerCase() +
							calledNot[1].slice(1);

						return () =>
							expect(fnFor(method)).not.toHaveBeenCalled();
					}

					const called = property.match(
						/^expect(.+)ToHaveBeenCalled$/,
					);
					if (called) {
						const method =
							called[1].charAt(0).toLowerCase() +
							called[1].slice(1);

						return () => expect(fnFor(method)).toHaveBeenCalled();
					}

					return fnFor(property);
				},
			},
		) as Mocked<T>;
	}
}
