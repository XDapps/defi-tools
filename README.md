# Defi Arbitrage Scanner Demo

This project demonstrates how to use Hardhat and Solidity to create and
deploy an arbitrage scanner to scrape data from multiple decentralized
exchanges in a single RPC call allowing you to scrape massive amounts of
data with minimal RPC calls.

## Installation

Please see .example.env file and recreate a .env in the same format.

> [!NOTE]
> The project will not run properly without a valid Infura API key and seed phrase in .env file. Seed phrase wallet can be random, it does NOT need a balance.

```shell
yarn

npx hardhat test
```

## Contracts

1. ArbUtils Library: manages decoding of exchange data.
   [Deployment](https://polygonscan.com/address/0xd91ffe16fdf90b81831d95e811c366c76d869894)

2. DecimalUtils Library: manages token decimal calculations and normalizing exchange rates.
   [Deployment](https://polygonscan.com/address/0x66251624649E0DaC7E1BF53A98cDDafed896e8b8)

3. SlippageUtils Library: manages calculation of slippage.
   [Deployment](https://polygonscan.com/address/0xedafdb092A50cE56488ad679fDe35396dE7cEEa2)

4. QuickswapV3Utils Library: manages interactions with QuickswapV3 contracts.
   [Deployment](https://polygonscan.com/address/0x0648ba3f5aa306AFf7BF9aCA812492B2954a2521)

5. UniswapV2Utils Library: manages interactions with UniswapV2 contracts.
   [Deployment](https://polygonscan.com/address/0x77103683893aAF702053AD1cD4A3E355FbD6E871)

6. UniswapV3Utils Library: manages interactions with UniswapV3 contracts.
   [Deployment](https://polygonscan.com/address/0x8183a36Cd907C6c0302B14FcD53432786D300B35)

7. ArbitrageScanner: contract that we interact with.
   [Scanner: Deployment](https://polygonscan.com/address/0xBB77739791647458E181262E11B3Db6Ab5a63647)

## How to Use

You may interact with these contracts already deployed on Polygon, or you may extend these contracts by adding additional exchange protocols and re-deploying them on the EVM network(s) of your choice.

## Interacting with Contracts

Try running some of the following tasks:

Get UniswapV2 pair counts, pair addresses, token addresses

```shell
npx hardhat run scripts/scrapers/scrapeV2PairCounts.ts --network polygon

npx hardhat run scripts/scrapers/scrapeV2PairAddresses.ts --network polygon 
```

Get normalized exchange rate(s) using a base asset and an array of potential pairs.

```shell
npx hh run scripts/exchange-rates/getExchangeRate.ts --network polygon 

npx hh run scripts/exchange-rates/getMultipleExchangeRates.ts --network polygon 
```

Validate prospective tokens by checking their liquidity vs other assets of your choice.

```shell
npx hh run scripts/validator/validateTokens.ts --network polygon 
```

Simulate the results of a multi-hop, multi-exchange trade path.

```shell
npx hh run scripts/simulate-trade/simulateTrade.ts --network polygon 
```

This allows you to store this data in a database and analyze potential arbitrage routes.

## Exchanges

The scanner contract allows for multiple exchanges to be added. At deployment, the following exchanges were loaded.

| DexId | Exchange    | Fee |
| :---  |    :----   | :---- |
| 0     | QuickswapV2 | 25 |
| 1     | QuickswapV3 | 3000* |
| 2     | UniswapV3   | 500, 3000, 10000 |

> [!NOTE]
> *QuickswapV3 has dynamic fees. Number used is a placeholder*.

## Adding Exchanges

To add an exchange, you'd simply call this method on your contract:

```solidity
    function setDexValues(
        uint256[] memory _dexIds,
        address[] memory _factories,
        address[] memory _routers,
        uint8[] memory _protocols
    ) public onlyOwner {
        for (uint256 i = 0; i < _dexIds.length; i++) {
            factories[_dexIds[i]] = _factories[i];
            routers[_dexIds[i]] = _routers[i];
            protocol[_dexIds[i]] = _protocols[i];
        }
    }
```

You could also deploy additional libraries to support additional exchange protocols and then add those protocols to the ArbitrageScanner contract.
