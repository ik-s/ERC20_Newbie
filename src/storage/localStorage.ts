import { STORAGE_KEY } from "../config";
import { createDefaultTokenDraft } from "../erc20/tokenGenerator";
import type { DeploymentRecord, PersistedState, TokenDraft } from "../types";

export function createDefaultPersistedState(): PersistedState {
  return {
    progress: { completedLessons: [], completedExercises: [], lastVisitedPath: "/" },
    tokenDraft: createDefaultTokenDraft(),
    editedSource: "",
    deployments: [],
    recentTransactionHashes: [],
  };
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isTokenDraft = (value: unknown): value is TokenDraft => {
  if (!value || typeof value !== "object") return false;
  const draft = value as Record<string, unknown>;
  return (
    typeof draft.name === "string" &&
    typeof draft.symbol === "string" &&
    typeof draft.initialSupply === "string" &&
    typeof draft.recipient === "string" &&
    typeof draft.decimals === "number" &&
    typeof draft.burnable === "boolean" &&
    typeof draft.mintable === "boolean" &&
    typeof draft.capped === "boolean" &&
    typeof draft.sourceCode === "string" &&
    (draft.maxSupply === undefined || typeof draft.maxSupply === "string")
  );
};

const isDeployment = (value: unknown): value is DeploymentRecord => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.chainId === "number" &&
    typeof record.contractAddress === "string" &&
    typeof record.transactionHash === "string" &&
    typeof record.deployer === "string" &&
    typeof record.name === "string" &&
    typeof record.symbol === "string" &&
    typeof record.decimals === "number" &&
    typeof record.deployedAt === "number"
  );
};

function isPersistedState(value: unknown): value is PersistedState {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  const progress = state.progress as Record<string, unknown> | undefined;
  return Boolean(
    progress &&
      isStringArray(progress.completedLessons) &&
      isStringArray(progress.completedExercises) &&
      typeof progress.lastVisitedPath === "string" &&
      isTokenDraft(state.tokenDraft) &&
      typeof state.editedSource === "string" &&
      Array.isArray(state.deployments) &&
      state.deployments.every(isDeployment) &&
      isStringArray(state.recentTransactionHashes),
  );
}

export function loadPersistedState(storage: Storage = localStorage): PersistedState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultPersistedState();
    const parsed: unknown = JSON.parse(raw);
    return isPersistedState(parsed) ? parsed : createDefaultPersistedState();
  } catch {
    return createDefaultPersistedState();
  }
}

export function savePersistedState(
  storage: Storage = localStorage,
  state: PersistedState,
): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}
