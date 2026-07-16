import { TokenSimulator } from "../erc20/simulator";
import { loadPersistedState, savePersistedState } from "../storage/localStorage";
import type { PersistedState, WalletStatus } from "../types";

export interface AppState {
  persisted: PersistedState;
  simulator: TokenSimulator;
  wallet: { status: WalletStatus; address?: string; chainId?: number; message?: string };
}

type Listener = (state: AppState) => void;

export function createStore(storage: Storage = localStorage) {
  let state: AppState = {
    persisted: loadPersistedState(storage),
    simulator: new TokenSimulator(),
    wallet: { status: "disconnected" },
  };
  const listeners = new Set<Listener>();

  return {
    getState: () => state,
    update(updater: (current: AppState) => AppState) {
      state = updater(state);
      savePersistedState(storage, state.persisted);
      listeners.forEach((listener) => listener(state));
    },
    notify() {
      listeners.forEach((listener) => listener(state));
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export type AppStore = ReturnType<typeof createStore>;
