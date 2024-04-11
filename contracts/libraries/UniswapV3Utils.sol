// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;
import "@uniswap/v2-core/contracts/interfaces/IERC20.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoterV2.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./SlippageUtils.sol";
import "./DecimalUtils.sol";

library UniswapV3Utils {
	
    function getPairAddressUniswapV3(
        address _factoryAddress,
        address _tokenA,
        address _tokenB,
        uint24 _fee
    ) public view returns (address) {
        try IUniswapV3Factory(_factoryAddress).getPool(_tokenA, _tokenB, _fee) returns (address pool) {
            return pool;
        } catch (bytes memory) {
            return address(0);
        }
    }


    function tokenIsValidUniswapV3(
        address _token,
        address _factoryAddress,
        address _quoterAddress,
        uint24[] memory _fees,
        address[] memory _potentialPairs,
        uint256[] memory _inputAmounts,
        uint256[] memory _maxSlippage
    ) public returns (bool) {
        bool isValid = false;
        for (uint256 i = 0; i < _potentialPairs.length; i++) {
            if (_potentialPairs[i] != _token) {
                isValid = _checkTokenValidityByFeeUniswapV3(
                    _token,
                    _factoryAddress,
                    _quoterAddress,
                    _fees,
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

    function _checkTokenValidityByFeeUniswapV3(
        address _token,
        address _factoryAddress,
        address _quoterAddress,
        uint24[] memory _fees,
        address _potentialPair,
        uint256 _inputAmount,
        uint256 _maxSlippage
    ) public returns (bool isValid) {
        isValid = false;
        for (uint256 i = 0; i < _fees.length; i++) {
            (bool hasLiquidity, ) = uniSwapV3PoolHasLiquidity(_factoryAddress, _token, _potentialPair, _fees[i]);
            if (!hasLiquidity) {
                break;
            }
            uint256 slippagePercentage = _getUniswapV3Slippage(
                _factoryAddress,
                _quoterAddress,
                _potentialPair,
                _token,
                _fees[i],
                _inputAmount
            );
            if (slippagePercentage <= _maxSlippage) {
                isValid = true;
                break;
            }
        }
        return isValid;
    }

    function _getUniswapV3Slippage(
        address _factoryAddress,
        address _quoterAddress,
        address _tokenIn,
        address _tokenOut,
        uint24 fee,
        uint256 amountIn
    ) public returns (uint256 estimatedSlippage) {
        uint256 smallTradeAmountIn = amountIn / 100;
        (uint256 smallTradeAmountOut, ) = getEstimatedTokensOutUniswapV3(
            _factoryAddress,
            _quoterAddress,
            _tokenIn,
            _tokenOut,
            smallTradeAmountIn,
            fee
        );
        (uint256 actualAmountOut, ) = getEstimatedTokensOutUniswapV3(
            _factoryAddress,
            _quoterAddress,
            _tokenIn,
            _tokenOut,
            amountIn,
            fee
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

    function uniSwapV3PoolHasLiquidity(
        address factory,
        address token1,
        address token2,
        uint24 fee
    ) public view returns (bool hasLiquidity, address poolAddress) {
        poolAddress = getPairAddressUniswapV3(factory, token1, token2, fee);
        if (poolAddress == address(0)) {
            hasLiquidity = false;
            return (hasLiquidity, poolAddress);
        }
        uint128 liquidity = IUniswapV3Pool(poolAddress).liquidity();
        hasLiquidity = liquidity > 0;
        return (hasLiquidity, poolAddress);
    }

    function getExchangeRateUniswapV3(
        address factoryAddress,
        address quoterAddress,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint24 fee
    ) public returns (uint256 exchangeRate, address poolAddress) {
        uint8 tokenInDecimals = DecimalUtils.getTokenDecimals(tokenIn);
        uint8 tokenOutDecimals = DecimalUtils.getTokenDecimals(tokenOut);
        (uint256 amountOut, address pool) = getEstimatedTokensOutUniswapV3(
            factoryAddress,
            quoterAddress,
            tokenIn,
            tokenOut,
            amountIn,
            fee
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
    function getEstimatedTokensOutUniswapV3(
        address factoryAddress,
        address quoterAddress,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint24 fee
    ) public returns (uint256 amountOut, address poolAddress) {
        (bool hasLiquidity, address pool) = uniSwapV3PoolHasLiquidity(factoryAddress, tokenIn, tokenOut, fee);
        if (!hasLiquidity) {
            amountOut = 0;
            poolAddress = address(0);
            return (amountOut, poolAddress);
        }
        poolAddress = pool;
        try IQuoter(quoterAddress).quoteExactInputSingle(tokenIn, tokenOut, fee, amountIn, 0) returns (
            uint256 _amountOut
        ) {
            amountOut = _amountOut;
        } catch (bytes memory) {
            amountOut = 0;
        }
        return (amountOut, poolAddress);
    }
    // executeSwap
    function _executeSwapUniswapV3(
        address _routerAddress,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _amountOutMinimum,
        uint24 _fee
    ) public {
        IERC20(_tokenIn).approve(_routerAddress, _amountIn);
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: _tokenIn,
            tokenOut: _tokenOut,
            fee: _fee,
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: _amountIn,
            amountOutMinimum: _amountOutMinimum,
            sqrtPriceLimitX96: 0
        });
        ISwapRouter(_routerAddress).exactInputSingle(params);
    }
}
