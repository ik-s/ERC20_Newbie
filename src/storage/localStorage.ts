import { STORAGE_KEY } from "../config";
import type { CodeLabTaskId } from "../erc20/codeLabTasks";
import { createDefaultTokenDraft } from "../erc20/tokenGenerator";
import type { DeploymentRecord, PersistedState, TokenDraft } from "../types";

export function createDefaultPersistedState(): PersistedState {
  return {
    progress: { completedLessons: [], completedExercises: [], lastVisitedPath: "/" },
    tokenDraft: createDefaultTokenDraft(),
    codeLabDrafts: {},
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

const CODE_LAB_TASK_IDS: readonly CodeLabTaskId[] = ["metadata", "balance", "transfer", "allowance", "transfer-from"];

function isCodeLabDrafts(value: unknown): value is Partial<Record<CodeLabTaskId, string>> {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.entries(value).every(([key, draft]) => CODE_LAB_TASK_IDS.includes(key as CodeLabTaskId) && typeof draft === "string"),
  );
}

function isPersistedStateBase(value: unknown): value is Omit<PersistedState, "codeLabDrafts"> & Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  const progress = state.progress as Record<string, unknown> | undefined;
  return Boolean(
    progress &&
      isStringArray(progress.completedLessons) &&
      isStringArray(progress.completedExercises) &&
      typeof progress.lastVisitedPath === "string" &&
      isTokenDraft(state.tokenDraft) &&
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
    if (!isPersistedStateBase(parsed)) return createDefaultPersistedState();
    const state = parsed as Omit<PersistedState, "codeLabDrafts"> & { codeLabDrafts?: unknown; editedSource?: unknown };
    const codeLabDrafts = isCodeLabDrafts(state.codeLabDrafts)
      ? state.codeLabDrafts
      : typeof state.editedSource === "string" && state.editedSource
        ? { metadata: state.editedSource }
        : {};
    return {
      progress: state.progress,
      tokenDraft: state.tokenDraft,
      codeLabDrafts,
      deployments: state.deployments,
      recentTransactionHashes: state.recentTransactionHashes,
    };
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
