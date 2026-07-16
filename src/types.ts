import type { Address, Hash } from "viem";

export interface LearningProgress {
  completedLessons: string[];
  completedExercises: string[];
  lastVisitedPath: string;
}

export interface TokenDraft {
  name: string;
  symbol: string;
  initialSupply: string;
  recipient: string;
  decimals: number;
  burnable: boolean;
  mintable: boolean;
  capped: boolean;
  maxSupply?: string;
  sourceCode: string;
}

export interface DeploymentRecord {
  chainId: number;
  contractAddress: Address;
  transactionHash: Hash;
  deployer: Address;
  name: string;
  symbol: string;
  decimals: number;
  deployedAt: number;
}

export interface PersistedState {
  progress: LearningProgress;
  tokenDraft: TokenDraft;
  editedSource: string;
  deployments: DeploymentRecord[];
  recentTransactionHashes: Hash[];
}

export type WalletStatus =
  | "unavailable"
  | "disconnected"
  | "connecting"
  | "connected"
  | "wrong-network"
  | "signing"
  | "pending"
  | "success"
  | "failed";
