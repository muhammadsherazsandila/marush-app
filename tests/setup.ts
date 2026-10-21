import { vi } from "vitest";

process.env.EXPO_OS = "web";

(globalThis as any).expo = {
  EventEmitter: class EventEmitter {
    addListener() {
      return { remove() {} };
    }
    removeListener() {}
    emit() {}
  },
};

(globalThis as any).ExpoModules = {};

vi.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: vi.fn(),
  openBrowserAsync: vi.fn(),
  dismissBrowser: vi.fn(),
}));

vi.mock("expo-crypto", () => ({
  randomUUID: () => "test-uuid-1234",
  digestStringAsync: vi.fn(),
}));

vi.mock("expo-linking", () => ({
  createURL: vi.fn(),
  parse: vi.fn(),
  addEventListener: vi.fn(() => ({ remove: vi.fn() })),
  getInitialURL: vi.fn().mockResolvedValue(null),
  openURL: vi.fn(),
}));

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {},
  },
}));
