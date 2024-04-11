// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "./SlippageUtils.sol";
import "./DecimalUtils.sol";

interface IQuickswapFactory {
    function poolByPair(address tokenA, address tokenB) external view returns (address);
}

interface IQuickSwapQuoter {
    function quoteExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint160 limitSqrtPrice
    ) external returns (uint256 amountOut, uint16 fee);
}

library QuickswapV3Utils {
    //getPairAddressByFee
    function getPairAddressQuickswapV3(
        address _factoryAddress,
        address _tokenA,
        address _tokenB
    ) public view returns (address) {
        return IQuickswapFactory(_factoryAddress).poolByPair(_tokenA, _tokenB);
    }

    //tokenIsValid
    function tokenIsValidQuickswapV3(
        address _token,
        address _factoryAddress,
        address _quoterAddress,
        address[] memory _potentialPairs,
        uint256[] memory _inputAmounts,
        uint256[] memory _maxSlippage
    ) public returns (bool) {
        bool isValid = false;
        for (uint256 i = 0; i < _potentialPairs.length; i++) {
            if (_potentialPairs[i] != _token) {
                isValid = _checkTokenValidityByFeeQuickswapV3(
                    _token,
                    _factoryAddress,
                    _quoterAddress,
                    _potentialPairs[i],
                    _inputAmounts[i],
                    _maxSlippage[i]
                );
                if (isValid) {
                    break;
                }
            }
        }
        return isValid;
    }

    //tokenIsValidByFee
    function _checkTokenValidityByFeeQuickswapV3(
        address _token,
        address _factoryAddress,
        address _quoterAddress,
        address _potentialPair,
        uint256 _inputAmount,
        uint256 _maxSlippage
    ) public returns (bool isValid) {
        isValid = false;
        (bool hasLiquidity, ) = quickSwapV3PoolHasLiquidity(_factoryAddress, _token, _potentialPair);
        if (!hasLiquidity) {
            return false;
        }
        uint256 slippagePercentage = _getQuickswapV3Slippage(
            _factoryAddress,
            _quoterAddress,
            _potentialPair,
            _token,
            _inputAmount
        );
        if (slippagePercentage <= _maxSlippage) {
            isValid = true;
        }

        return isValid;
    }

    function _getQuickswapV3Slippage(
        address _factoryAddress,
        address _quoterAddress,
        address _tokenIn,
        address _tokenOut,
        uint256 amountIn
    ) public returns (uint256 estimatedSlippage) {
        uint256 smallTradeAmountIn = amountIn / 100;
        (uint256 smallTradeAmountOut, ) = getEstimatedTokensOutQuickswapV3(
            _factoryAddress,
            _quoterAddress,
            _tokenIn,
            _tokenOut,
            smallTradeAmountIn
        );
        (uint256 actualAmountOut, ) = getEstimatedTokensOutQuickswapV3(
            _factoryAddress,
            _quoterAddress,
            _tokenIn,
            _tokenOut,
            amountIn
        );
        if (smallTradeAmountOut == 0) {
            return 10000;
        }
        if (actualAmountOut < smallTradeAmountOut * 100) {
            return SlippageUtils.calculateSlippagePercentage((smallTradeAmountOut * 100), actualAmountOut); // Basis points
        } else {
            return 0;
        }
    }

    //poolHasLiquidity

    function quickSwapV3PoolHasLiquidity(
        address factory,
        address token1,
        address token2
    ) public view returns (bool hasLiquidity, address poolAddress) {
        poolAddress = getPairAddressQuickswapV3(factory, token1, token2);
        if (poolAddress == address(0)) {
            hasLiquidity = false;
        } else {
            uint128 liquidity = IUniswapV3Pool(poolAddress).liquidity();
            hasLiquidity = liquidity > 0;
        }
    }
    // getExchangeRate
    function getExchangeRateQuickswapV3(
        address factoryAddress,
        address quoterAddress,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public returns (uint256 exchangeRate, address poolAddress) {
        uint8 tokenInDecimals = DecimalUtils.getTokenDecimals(tokenIn);
        uint8 tokenOutDecimals = DecimalUtils.getTokenDecimals(tokenOut);
        (uint256 amountOut, address pool) = getEstimatedTokensOutQuickswapV3(
            factoryAddress,
            quoterAddress,
            tokenIn,
            tokenOut,
            amountIn
        );
        poolAddress = pool;
        if (amountOut == 0) {
            exchangeRate = 0;
        } else {
            exchangeRate = DecimalUtils.calculateExchangeRate(amountIn, tokenInDecimals, amountOut, tokenOutDecimals);
		}
        return (exchangeRate, poolAddress);
    }

    // getExpectedTokensOut
    function getEstimatedTokensOutQuickswapV3(
        address factoryAddress,
        address quoterAddress,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public returns (uint256 amountOut, address poolAddress) {
        (bool hasLiquidity, address pool) = quickSwapV3PoolHasLiquidity(factoryAddress, tokenIn, tokenOut);
        if (!hasLiquidity) {
            amountOut = 0;
            poolAddress = address(0);
            return (amountOut, poolAddress);
        }
        poolAddress = pool;
        try IQuickSwapQuoter(quoterAddress).quoteExactInputSingle(tokenIn, tokenOut, amountIn, 0) returns (
            uint256 _amountOut,
            uint16
        ) {
            amountOut = _amountOut;
        } catch (bytes memory) {
            amountOut = 0;
        }
    }
    // executeSwap
}
