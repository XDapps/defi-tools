// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import "@uniswap/v2-core/contracts/interfaces/IERC20.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "./SlippageUtils.sol";
import "./DecimalUtils.sol";

library UniswapV2Utils {
	
    function getPairAddressUniswapV2(
        address _factoryAddress,
        address _tokenA,
        address _tokenB
    ) public view returns (address) {
        address pair = IUniswapV2Factory(_factoryAddress).getPair(_tokenA, _tokenB);
        return pair;
    }

    function tokenIsValidUniswapV2(
        address _token,
        address _factoryAddress,
        address _router,
        address[] memory _potentialPairs,
        uint256[] memory _inputAmounts,
        uint256[] memory _maxSlippage
    ) public view returns (bool) {
        bool isValid = false;
        for (uint256 i = 0; i < _potentialPairs.length; i++) {
            if (_potentialPairs[i] != _token) {
                uint256 slippagePercentage = _getUniswapV2Slippage(
                    _factoryAddress,
                    _router,
                    _potentialPairs[i],
                    _token,
                    _inputAmounts[i]
                );
                if (slippagePercentage <= _maxSlippage[i]) {
                    isValid = true;
                    break;
                }
            }
        }
        return isValid;
    }

    function _getUniswapV2Slippage(
        address _factoryAddress,
        address _router,
        address _tokenIn,
        address _tokenOut,
        uint256 amountIn
    ) public view returns (uint256 estimatedSlippage) {
        uint256 smallTradeAmountIn = amountIn / 100;
        (uint256 smallTradeAmountOut, ) = getEstimatedTokensOutUniswapV2(
            _factoryAddress,
            _router,
            _tokenIn,
            _tokenOut,
            smallTradeAmountIn
        );
        (uint256 actualAmountOut, ) = getEstimatedTokensOutUniswapV2(
            _factoryAddress,
            _router,
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

    function getExchangeRateUniswapV2(
        address factoryAddress,
        address routerAddress,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public view returns (uint256 exchangeRate, address poolAddress) {
        uint8 tokenInDecimals = DecimalUtils.getTokenDecimals(tokenIn);
        uint8 tokenOutDecimals = DecimalUtils.getTokenDecimals(tokenOut);
        (uint256 amountOut, address pool) = getEstimatedTokensOutUniswapV2(
            factoryAddress,
            routerAddress,
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

    function getEstimatedTokensOutUniswapV2(
        address factoryAddress,
        address routerAddress,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public view returns (uint256 amountOut, address poolAddress) {
        poolAddress = getPairAddressUniswapV2(factoryAddress, tokenIn, tokenOut);
        if (poolAddress == address(0)) {
            amountOut = 0;
            return (amountOut, poolAddress);
        }
        IUniswapV2Pair pair = IUniswapV2Pair(poolAddress);
        (uint reserve0, uint reserve1, ) = pair.getReserves();
        address token0 = pair.token0();
        (uint reserveIn, uint reserveOut) = tokenIn == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
        if (reserveIn == 0 || reserveOut == 0) {
            return (0, poolAddress);
        }
        amountOut = IUniswapV2Router02(routerAddress).getAmountOut(amountIn, reserveIn, reserveOut);
		return (amountOut, poolAddress);
    }
}
