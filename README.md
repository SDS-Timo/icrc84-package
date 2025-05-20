# ICRC84 Package

[![npm version](https://img.shields.io/npm/v/icrc84-package.svg)](https://www.npmjs.com/package/icrc84-package)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A TypeScript library for interacting with ICRC-84 tokens management and wallet operations on the Internet Computer (IC) blockchain ecosystem.

## Overview

The ICRC84 package provides a set of hooks and utilities for seamless integration with ICRC-84 standard tokens on the Internet Computer Protocol. This library offers wallet connectivity through the useWallet hook for balance checking, deposits, withdrawals, and allowance management, along with the useTokens hook for accessing token information and metadata. Built with TypeScript support, it enables developers to easily implement token operations in decentralized applications built on ICP.

## Features

- 🔌 **Wallet Operations** - Hooks for managing Internet Computer wallet balances and transactions
- 💰 **Balance Management** - Functions for checking and managing token balances
- 💳 **Deposit Operations** - Support for deposits, withdrawals and allowances
- 🪙 **Token Data Access** - Utilities to fetch token information and metadata
- 🛠️ **TypeScript Support** - Full TypeScript definitions for type safety
- 🧩 **Modular Design** - Composable hooks for flexible implementation

## Installation

```bash
# Using npm
npm install icrc84-package

# Using yarn
yarn add icrc84-package
```

## Requirements

This package has the following peer dependencies:

- `@dfinity/agent`: ^2.1.3
- `@dfinity/ledger-icrc`: ^2.6.3
- `@dfinity/principal`: ^2.1.3

## Quick Start

```typescript
import { useWallet, useTokens } from 'icrc84-package'
import { idlFactory } from './icrc1_auction.did'

// Canister ID
const canisterId = `Your canister ID`

// User Agent
const userAgent = `Your user Agent`

// Access balance information
const { getBalance } = useWallet(userAgent, canisterId, idlFactory)

// Example: get balance
const balance = await getBalance(
  [token],
  `${token.principal}`,
  userPrincipal,
  'claim',
)

// Access token information
const { getTokens } = useTokens(userAgent, canisterId, idlFactory)

// Example: get tokens
const { tokens } = await getTokens()
```

## Using Types

The library exports TypeScript types that you can import in your project:

```typescript
import { TokenMetadata, TokenDataItem, Result } from 'icrc84-package'

// Example: Define a typed variable
const myToken: TokenMetadata = {
  symbol: 'ICP',
  name: 'Internet Computer Protocol',
  decimals: 8,
  logo: 'icp-logo.svg',
  fee: 0.0001,
  feeNat: '10000',
  quote: 'USD',
  base: 'ICP',
}

// Example: Type a function parameter
function processToken(token: TokenMetadata) {
  // Process token information
}
```

## API Reference

### `useWallet(userAgent, canisterId, idlFactory)`

Hook for wallet operations and balance management.

**Parameters:**

- `userAgent`: The HTTP agent for interacting with the Internet Computer
- `canisterId`: The canister ID
- `idlFactory`: The IDL factory for canister interaction

**Returns:**

- `getBalance(tokens, principal, account, action)`: Function to get account balance
- `getTrackedDeposit(tokens, principal)`: Function to get tracked deposits
- `balanceNotify(principal)`: Function to notify balance updates
- `withdrawCredit(principal, account, amount)`: Function to withdraw credit
- `getDepositAllowanceInfo(principal, account)`: Function to get deposit allowance info
- `deposit(principal, account, amount)`: Function to deposit credit

### `useTokens(userAgent, canisterId, idlFactory)`

Hook for token operations and management.

**Parameters:**

- `userAgent`: The HTTP agent for interacting with the Internet Computer
- `canisterId`: The canister ID
- `idlFactory`: The IDL factory for canister interaction

**Returns:**

- `getTokens()`: Function to get all supported tokens
- `getQuoteToken()`: Function to get the quote token

## Security

This package follows best practices for secure interactions with the Internet Computer protocol. However, always audit your integration and ensure proper security measures in your application.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions about this package, please file an issue on the [GitHub repository](https://github.com/SDS-Timo/icrc84-package/issues).
