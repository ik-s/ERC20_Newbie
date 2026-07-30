import { describe, expect, it } from "vitest";
import {
  createDefaultPersistedState,
  loadPersistedState,
  savePersistedState,
} from "../src/storage/localStorage";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe("local persistence", () => {
  it("recovers corrupted JSON to safe defaults", () => {
    const storage = new MemoryStorage();
    storage.setItem("erc20-lab:v1", "{broken");

    expect(loadPersistedState(storage)).toEqual(createDefaultPersistedState());
  });

  it("rejects invalid stored shapes", () => {
    const storage = new MemoryStorage();
    storage.setItem("erc20-lab:v1", JSON.stringify({ completedLessons: "all" }));

    expect(loadPersistedState(storage)).toEqual(createDefaultPersistedState());
  });

  it("round-trips valid learning and token data", () => {
    const storage = new MemoryStorage();
    const state = createDefaultPersistedState();
    state.progress.completedLessons.push("learn");
    state.progress.lastVisitedPath = "/functions/transfer";
    state.tokenDraft.name = "Study Token";

    savePersistedState(storage, state);

    expect(loadPersistedState(storage)).toEqual(state);
  });

  it("persists code lab drafts independently by mission", () => {
    const storage = new MemoryStorage();
    const state = createDefaultPersistedState();
    state.codeLabDrafts.balance = "balance draft";
    state.codeLabDrafts.transfer = "transfer draft";

    savePersistedState(storage, state);

    expect(loadPersistedState(storage).codeLabDrafts).toEqual({
      balance: "balance draft",
      transfer: "transfer draft",
    });
  });

  it("migrates the legacy shared code lab source to the metadata mission", () => {
    const storage = new MemoryStorage();
    const legacy = createDefaultPersistedState() as unknown as Record<string, unknown>;
    delete legacy.codeLabDrafts;
    legacy.editedSource = "legacy source";
    storage.setItem("erc20-lab:v1", JSON.stringify(legacy));

    expect(loadPersistedState(storage).codeLabDrafts).toEqual({ metadata: "legacy source" });
  });
});
