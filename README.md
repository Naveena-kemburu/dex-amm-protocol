# dex-amm-protocol

A simplified Decentralized Exchange using Automated Market Maker (AMM) protocol with constant product formula (x*y=k)

## Project Overview

This project implements a fully functional Decentralized Exchange (DEX) using the Automated Market Maker (AMM) model, similar to Uniswap V2. The implementation demonstrates how modern DeFi protocols enable decentralized trading without centralized intermediaries.

## Task Description

The objective was to build a simplified DEX that allows users to:
- Add liquidity to trading pairs and receive LP (Liquidity Provider) tokens
- Remove liquidity by burning LP tokens
- Swap between two ERC-20 tokens using the constant product formula
- Earn trading fees as a liquidity provider

## Key Features

### 1. **Liquidity Pool Management**
- Add initial and subsequent liquidity to the pool
- Proportional LP token minting using the square root formula for initial liquidity
- LP token distribution based on share of the pool
- Remove liquidity and withdraw tokens with accrued fees

### 2. **Constant Product Formula (AMM)**
- Implements the formula: `x * y = k`
- Where x and y are token reserves and k remains constant (ignoring fees)
- Automatic price discovery based on reserve ratios
- Ensures no arbitrage opportunities in the pool

### 3. **Trading Mechanism**
- Swap TokenA for TokenB: `swapAForB()`
- Swap TokenB for TokenA: `swapBForA()`
- 0.3% trading fee mechanism:
  - Formula: `amountInWithFee = amountIn * 997`
  - Output: `amountOut = (amountInWithFee * reserveOut) / ((reserveIn * 1000) + amountInWithFee)`
  - Fees remain in the pool, benefiting liquidity providers

### 4. **Price Discovery**
- Current price: `Price = reserveB / reserveA`
- Price updates dynamically after each trade
- `getPrice()` and `getReserves()` functions for querying pool state

## Architecture

### Smart Contracts

#### **contracts/DEX.sol**
Main DEX contract implementing:
- State management for token reserves and LP ownership
- Liquidity management functions
- Swap functionality with fee calculations
- Price discovery mechanisms
- Square root calculation for LP token minting

**Key Functions:**
- `addLiquidity(uint256 amountA, uint256 amountB)` - Add liquidity to pool
- `removeLiquidity(uint256 liquidityAmount)` - Remove liquidity and burn LP tokens
- `swapAForB(uint256 amountAIn)` - Swap token A for token B
- `swapBForA(uint256 amountBIn)` - Swap token B for token A
- `getPrice()` - Get current exchange rate
- `getReserves()` - Get current pool reserves
- `getAmountOut()` - Calculate output amount with fees

#### **contracts/MockERC20.sol**
ERC-20 token contract for testing:
- Inherits from OpenZeppelin's ERC20
- Mints 1 million tokens to deployer on creation
- Includes mint function for test token distribution

## Testing

### Test Suite: **test/DEX.test.js**
Comprehensive testing with 27 test cases covering:

#### Liquidity Management Tests (8 tests)
- Initial liquidity provision
- Correct LP token minting for first provider
- Subsequent liquidity additions
- Price ratio maintenance
- Partial liquidity removal
- Correct token amounts on removal
- Error handling for zero amounts
- Prevention of over-withdrawal

#### Token Swap Tests (8 tests)
- Token A to Token B swaps
- Token B to Token A swaps
- Correct output calculation with 0.3% fee
- Reserve updates after swaps
- Constant product verification (k increases due to fees)
- Error handling for zero swaps
- Large swaps with high price impact
- Multiple consecutive swaps

#### Price Calculation Tests (3 tests)
- Initial price verification
- Price updates after swaps
- Error handling for zero reserves

#### Fee Distribution Tests (2 tests)
- Fee accumulation for liquidity providers
- Proportional fee distribution based on LP share

#### Edge Cases Tests (3 tests)
- Very small liquidity amounts
- Very large liquidity amounts
- Unauthorized access prevention

#### Event Tests (3 tests)
- LiquidityAdded event emission
- LiquidityRemoved event emission
- Swap event emission

### Running Tests

```bash
# Without Docker
npm install
npm test

# With Docker
docker-compose up -d
docker-compose exec app npm test
```

## Setup Instructions

### Prerequisites
- Node.js v18+
- Docker & Docker Compose (optional)
- Git

### Installation (Local)

1. Clone the repository:
```bash
git clone https://github.com/Naveena-kemburu/dex-amm-protocol.git
cd dex-amm-protocol
```

2. Install dependencies:
```bash
npm install
```

3. Compile contracts:
```bash
npm run compile
```

4. Run tests:
```bash
npm test
```

5. Check coverage:
```bash
npm run coverage
```

6. Deploy contracts:
```bash
npm run deploy
```

### Docker Setup

1. Build and start containers:
```bash
docker-compose up -d
```

2. Run tests in container:
```bash
docker-compose exec app npm test
```

3. View coverage:
```bash
docker-compose exec app npm run coverage
```

4. Stop containers:
```bash
docker-compose down
```

## Implementation Details

### Mathematical Formulas

#### LP Token Minting (First Provider)
```
liquidityMinted = sqrt(amountA * amountB)
```

#### Subsequent Liquidity Additions
```
liquidityA = (amountA * totalLiquidity) / reserveA
liquidityB = (amountB * totalLiquidity) / reserveB
liquidityMinted = min(liquidityA, liquidityB)  // Take minimum for balanced pool
```

#### Liquidity Removal
```
amountA = (liquidityBurned * reserveA) / totalLiquidity
amountB = (liquidityBurned * reserveB) / totalLiquidity
```

#### Swap Output Calculation (with 0.3% fee)
```
amountInWithFee = amountIn * 997  // 99.7% of input (0.3% fee deducted)
numerator = amountInWithFee * reserveOut
denominator = (reserveIn * 1000) + amountInWithFee
amountOut = numerator / denominator
```

### Constant Product Formula Verification
```
Before Swap: k = reserveA * reserveB
After Swap: k' = reserveA' * reserveB'

The fee mechanism ensures: k' >= k (k increases due to fee accumulation)
```

## Project Structure

```
dex-amm-protocol/
├── contracts/
│   ├── DEX.sol                 # Main DEX implementation
│   └── MockERC20.sol           # ERC-20 token for testing
├── test/
│   └── DEX.test.js             # 27 comprehensive test cases
├── scripts/
│   └── deploy.js               # Deployment script
├── Dockerfile                  # Docker container configuration
├── docker-compose.yml          # Docker compose setup
├── .dockerignore                # Files to exclude from Docker
├── hardhat.config.js           # Hardhat configuration
├── package.json                # Project dependencies
└── README.md                   # This file
```

## Technologies Used

- **Solidity 0.8.19** - Smart contract language
- **Hardhat** - Ethereum development framework
- **Ethers.js** - Ethereum library for JavaScript
- **Chai** - Testing framework assertions
- **Node.js 18** - JavaScript runtime
- **Docker** - Containerization
- **OpenZeppelin** - Secure smart contract libraries

## Completed Work Summary

✅ **Smart Contracts Implemented**
- DEX.sol with full AMM functionality
- MockERC20.sol for testing

✅ **Comprehensive Test Suite**
- 27 test cases covering all functionality
- Liquidity management tests
- Swap mechanism tests
- Fee distribution verification
- Edge case handling
- Event emission tests

✅ **Configuration & Setup**
- Hardhat configuration with optimization
- Package.json with all dependencies
- Docker setup with Dockerfile and docker-compose.yml
- .dockerignore for efficient builds

✅ **Deployment**
- Deployment script (scripts/deploy.js)
- Automated contract deployment and logging

✅ **Documentation**
- Comprehensive README
- NatSpec comments in contracts
- Clear function descriptions
- Setup and usage instructions

## Security Considerations

1. **Input Validation** - All functions validate inputs (non-zero amounts)
2. **State Management** - Proper reserve tracking and updates
3. **Overflow Protection** - Solidity 0.8+ automatic overflow checks
4. **Event Tracking** - All state changes emit events for transparency
5. **Fee Mechanism** - Secure 0.3% fee calculation

## Known Limitations

1. **No Slippage Protection** - Can add minAmountOut parameter for production
2. **Single Pair** - Only supports one trading pair
3. **No Flash Loans** - Can be added for advanced features
4. **Basic Access Control** - No role-based permissions

## Future Enhancements

- Slippage protection with minAmountOut parameters
- Multiple trading pairs support
- Flash swap functionality
- Governance token implementation
- Time-locked transactions
- Advanced routing for token paths

## Repository

🔗 [GitHub Repository](https://github.com/Naveena-kemburu/dex-amm-protocol)

## Author

Kemburu Naveena - Blockchain Developer

## License

MIT License - Free to use for educational purposes

---

**Last Updated:** January 2, 2026  
**Status:** Completed Implementation with Comprehensive Testing
