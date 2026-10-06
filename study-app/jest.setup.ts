import "@testing-library/jest-dom";
import { deserialize, serialize } from "node:v8";
import { TextDecoder, TextEncoder } from "node:util";

// jsdom lacks these browser APIs used by routing and persisted statistics.
Object.assign(globalThis, { TextDecoder, TextEncoder, structuredClone: <T>(value: T): T => deserialize(serialize(value)) as T });

// Browser-only modal and scroll APIs are absent from jsdom.
window.scrollTo = jest.fn();
HTMLDialogElement.prototype.showModal = function (): void { this.setAttribute("open", ""); };
HTMLDialogElement.prototype.close = function (): void { this.removeAttribute("open"); };
