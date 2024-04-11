// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "./libraries/ArbUtils.sol";
import "./libraries/UniswapV3Utils.sol";
import "./libraries/UniswapV2Utils.sol";
import "./libraries/QuickswapV3Utils.sol";

/// @custom:oz-upgrades-unsafe-allow external-library-linking
contract ArbitrageScannerV2 is OwnableUpgradeable {
    mapping(uint256 => address) public factories;
    mapping(uint256 => address) public routers;
    mapping(uint256 => address) public quoters;
    mapping(uint256 => uint8) public protocol; //0 for UniswapV2, 1 for UniswapV3, 2 for QuickswapV3
    mapping(uint256 => uint24[]) public dexFees;

    function initializeContract() public initializer {}

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

    function getTotalPairs(uint256[] memory _dexIds) public view returns (uint256[] memory) {
        uint256[] memory totalPairs = new uint256[](_dexIds.length);
        for (uint256 i = 0; i < _dexIds.length; i++) {
            if (protocol[_dexIds[i]] == 0) {
                IUniswapV2Factory factory = IUniswapV2Factory(factories[_dexIds[i]]);
                totalPairs[i] = factory.allPairsLength();
            }
        }
        return totalPairs;
    }

    function getV2PairsAndTokens(
        address _factoryAddress,
        uint256 beginAt,
        uint256 qty
    ) public view returns (address[] memory, address[] memory) {
        address[] memory pairs = new address[](qty);
        address[] memory tokens = new address[](qty * 2);
        uint256 pairIndex = 0;
        uint256 tokenIndex = 0;
        IUniswapV2Factory factory = IUniswapV2Factory(_factoryAddress);
        uint256 endAt = beginAt + qty;
        for (uint256 j = beginAt; j < endAt; j++) {
            if (pairIndex >= qty) {
                return (pairs, tokens);
            }
            address pair = factory.allPairs(j);
            pairs[pairIndex] = pair;
            tokens[tokenIndex] = IUniswapV2Pair(pair).token0();
            tokens[tokenIndex + 1] = IUniswapV2Pair(pair).token1();
            pairIndex += 1;
            tokenIndex += 2;
        }
        return (pairs, tokens);
    }

    function validateTokens(
        address[] memory _tokensToCheck,
        uint256[] memory _dexs,
        address[] memory _potentialPairs,
        uint256[] memory _inputAmounts,
        uint256[] memory _maxSlippage
    ) public returns (address[] memory) {
        address[] memory validTokens = new address[](_tokensToCheck.length);
        for (uint256 i = 0; i < _tokensToCheck.length; i++) {
            validTokens[i] = _checkTokenValidity(
                _tokensToCheck[i],
                _dexs,
                _potentialPairs,
                _inputAmounts,
                _maxSlippage
            );
        }
        return validTokens;
    }

    function _checkTokenValidity(
        address _token,
        uint256[] memory _dexs,
        address[] memory _potentialPairs,
        uint256[] memory _inputAmounts,
        uint256[] memory _maxSlippage
    ) internal returns (address) {
        for (uint256 i = 0; i < _dexs.length; i++) {
            bool isValid = _tokenIsValidAtDex(_token, _dexs[i], _potentialPairs, _inputAmounts, _maxSlippage);
            if (isValid) {
                return _token;
            }
        }
        return address(0);
    }

    function _tokenIsValidAtDex(
        address _token,
        uint256 _dexId,
        address[] memory _potentialPairs,
        uint256[] memory _inputAmounts,
        uint256[] memory _maxSlippage
    ) internal returns (bool) {
        bool isValid = false;
        if (protocol[_dexId] == 0) {
            isValid = UniswapV2Utils.tokenIsValidUniswapV2(
                _token,
                factories[_dexId],
                routers[_dexId],
                _potentialPairs,
                _inputAmounts,
                _maxSlippage
            );
        } else if (protocol[_dexId] == 1) {
            isValid = UniswapV3Utils.tokenIsValidUniswapV3(
                _token,
                factories[_dexId],
                quoters[_dexId],
                dexFees[_dexId],
                _potentialPairs,
                _inputAmounts,
                _maxSlippage
            );
        } else if (protocol[_dexId] == 2) {
            isValid = QuickswapV3Utils.tokenIsValidQuickswapV3(
                _token,
                factories[_dexId],
                quoters[_dexId],
                _potentialPairs,
                _inputAmounts,
                _maxSlippage
            );
        }
        return isValid;
    }

    function getMultipleExchangeRatesBoth(
        address _baseAsset,
        uint256 _baseAssetInputAmount,
        address[] memory _pairedAssets,
        uint256[] memory _inputAmounts,
        uint24[] memory _encodedDexs
    ) public returns (uint256[] memory, uint256[] memory, address[] memory) {
        uint256[] memory exchangeRates = new uint256[](_pairedAssets.length * _encodedDexs.length);
        uint256[] memory reverseRates = new uint256[](_pairedAssets.length * _encodedDexs.length);
        address[] memory poolAddresses = new address[](_pairedAssets.length * _encodedDexs.length);
        uint256 counter = 0;

        for (uint256 i = 0; i < _pairedAssets.length; i++) {
            for (uint256 j = 0; j < _encodedDexs.length; j++) {
                (exchangeRates[counter], poolAddresses[counter]) = getExchangeRate(
                    _baseAsset,
                    _pairedAssets[i],
                    _baseAssetInputAmount,
                    _encodedDexs[j]
                );
                (reverseRates[counter], poolAddresses[counter]) = getExchangeRate(
                    _pairedAssets[i],
                    _baseAsset,
                    _inputAmounts[i],
                    _encodedDexs[j]
                );
                counter++;
            }
        }
        return (exchangeRates, reverseRates, poolAddresses);
    }

    function getMultipleExchangeRates(
        address _baseAsset,
        address[] memory _pairedAssets,
        uint256[] memory _inputAmounts,
        uint24[] memory _encodedDexs
    ) public returns (uint256[] memory, address[] memory) {
        uint256[] memory exchangeRates = new uint256[](_pairedAssets.length * _encodedDexs.length);
        address[] memory poolAddresses = new address[](_pairedAssets.length * _encodedDexs.length);
        uint256 counter = 0;
        for (uint256 i = 0; i < _pairedAssets.length; i++) {
            for (uint256 j = 0; j < _encodedDexs.length; j++) {
                address poolAddress;
                (exchangeRates[counter], poolAddress) = getExchangeRate(
                    _pairedAssets[i],
                    _baseAsset,
                    _inputAmounts[i],
                    _encodedDexs[j]
                );
                poolAddresses[counter] = poolAddress;
                counter++;
            }
        }
        return (exchangeRates, poolAddresses);
    }

    function getExchangeRate(
        address _inAsset,
        address _outAsset,
        uint256 _amountIn,
        uint24 _encodedDex
    ) public returns (uint256 exchangeRate, address poolAddress) {
        if (_inAsset == _outAsset) {
            return (0, address(0));
        }
        uint256 exchangeId = ArbUtils.decodeExchangeId(_encodedDex);
        uint24 feeAmount = ArbUtils.decodeFeeAmount(_encodedDex);
        if (protocol[exchangeId] == 0) {
            (exchangeRate, poolAddress) = UniswapV2Utils.getExchangeRateUniswapV2(
                factories[exchangeId],
                routers[exchangeId],
                _inAsset,
                _outAsset,
                _amountIn
            );
        } else if (protocol[exchangeId] == 1) {
            (exchangeRate, poolAddress) = UniswapV3Utils.getExchangeRateUniswapV3(
                factories[exchangeId],
                quoters[exchangeId],
                _inAsset,
                _outAsset,
                _amountIn,
                feeAmount
            );
        } else if (protocol[exchangeId] == 2) {
            (exchangeRate, poolAddress) = QuickswapV3Utils.getExchangeRateQuickswapV3(
                factories[exchangeId],
                quoters[exchangeId],
                _inAsset,
                _outAsset,
                _amountIn
            );
        }
        return (exchangeRate, poolAddress);
    }

    function simulateTrade(
        address[] memory tokens,
        uint24[] memory encodedExchanges,
        uint256 amountIn
    ) public returns (uint256 amountOut) {
        for (uint256 i = 0; i < tokens.length - 1; i++) {
            uint256 exchangeId = ArbUtils.decodeExchangeId(encodedExchanges[i]);
            uint24 feeAmount = ArbUtils.decodeFeeAmount(encodedExchanges[i]);
            if (protocol[exchangeId] == 0) {
                (amountIn, ) = UniswapV2Utils.getEstimatedTokensOutUniswapV2(
                    factories[exchangeId],
                    routers[exchangeId],
                    tokens[i],
                    tokens[i + 1],
                    amountIn
                );
            } else if (protocol[exchangeId] == 1) {
                (amountIn, ) = UniswapV3Utils.getEstimatedTokensOutUniswapV3(
                    factories[exchangeId],
                    quoters[exchangeId],
                    tokens[i],
                    tokens[i + 1],
                    amountIn,
                    feeAmount
                );
            } else if (protocol[exchangeId] == 2) {
                (amountIn, ) = QuickswapV3Utils.getEstimatedTokensOutQuickswapV3(
                    factories[exchangeId],
                    quoters[exchangeId],
                    tokens[i],
                    tokens[i + 1],
                    amountIn
                );
            }
            amountOut = amountIn;
        }
        return amountOut;
    }
}
