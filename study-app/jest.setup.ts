import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "node:util";

// jsdom does not provide these, but react-router relies on them.
Object.assign(globalThis, { TextDecoder, TextEncoder });
