# ERC-20 Lab Design

## Product intent

ERC-20 Lab is a Korean-first interactive learning site for Web3 beginners. It connects every visible action to the ERC-20 function call, state change, emitted event, Solidity implementation, browser-side TypeScript, and—only after the local lessons—the corresponding Sepolia transaction.

## Experience structure

The product follows five progressive stages: understand the standard, run six core functions locally, inspect the executed code, edit and compile an educational contract, and generate/deploy an OpenZeppelin token. The home route presents the roadmap and resume state. A lightweight History API router supports `/`, `/learn`, `/functions`, all six function routes, `/code-lab`, `/token-builder`, and `/my-token` with refresh-safe rendering.

Local lessons always work without a wallet. Alice begins with 1,000 LAB, Bob with 100 LAB, and DEX with 0 LAB. `bigint` backs balances, supply, allowances, and event values. Failed operations are atomic and return a Korean beginner-friendly explanation. Every successful exercise opens a synchronized Solidity/TypeScript code panel and records progress locally.

## Visual direction

The UI follows the generated Coinbase design analysis in `DESIGN.md`: white canvas, sparse Coinbase Blue `#0052ff`, near-black editorial bands, soft gray surfaces, calm regular-weight display typography, pill actions, 24px cards, and generous section rhythm. The site uses system sans-serif and monospace fallbacks rather than Coinbase’s licensed fonts. Dense developer information is progressively disclosed so the first view stays approachable.

## Architecture

The frontend is plain Vite, TypeScript, Vanilla DOM API, and Vanilla CSS. No React, framework router, UI kit, or state library is used. Feature modules expose small typed interfaces: the simulator owns token state, the store owns subscriptions and persistence, the router owns navigation, lesson metadata drives the six function pages, the compiler communicates with a Web Worker, and the wallet module isolates EIP-1193/viem interactions.

CodeMirror 6 provides editing. `solc-js` compiles in a worker with a source-length cap, timeout, cancellation, and a build-generated OpenZeppelin source map. Token generation composes only the selected OpenZeppelin extensions. viem validates addresses, converts units, connects an injected wallet, enforces Sepolia, simulates supported calls, deploys bytecode, and waits for receipts. Private keys and recovery phrases are never accepted or stored.

## State and persistence

The app store contains progress, simulation, wallet status, compiler status, token draft, and deployment records. Only serializable learning progress, drafts, edited code, deployed addresses, and recent hashes are stored in `localStorage`. Runtime validators recover corrupted entries to defaults. Simulation maps remain in memory and can be reset from every function lab.

## Error handling and safety

Validation runs before state mutation or network writes. Errors show the technical message and a short Korean explanation. Mainnet and unsupported networks disable writes. The compiler accepts only bundled OpenZeppelin imports and bounded source text. User text is assigned with DOM properties, never interpolated into `innerHTML`. Network actions expose request, signing, pending, success, rejection, and failure states through an ARIA live region.

## Testing and completion

Vitest covers simulator atomicity and events, unit conversion, storage recovery, and token-generator option combinations. TypeScript checking, tests, and production build must all pass. Browser-only wallet and Sepolia actions remain dependent on an injected wallet, test ETH, and an optional `VITE_ALLOWANCE_PLAYGROUND_ADDRESS`; the README documents these prerequisites and the helper-contract deployment flow.

