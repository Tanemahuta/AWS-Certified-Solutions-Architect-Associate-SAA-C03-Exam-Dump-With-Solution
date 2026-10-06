import "@testing-library/jest-dom";
import { deserialize, serialize } from "node:v8";
import { TextDecoder, TextEncoder } from "node:util";

// jsdom lacks these browser APIs used by routing and persisted statistics.
Object.assign(globalThis, { TextDecoder, TextEncoder, structuredClone: <T>(value: T): T => deserialize(serialize(value)) as T });
