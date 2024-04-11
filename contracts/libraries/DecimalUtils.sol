// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IERCDecimals {
    function decimals() external view returns (uint8);
}

library DecimalUtils {
    function getTokenDecimals(address token) public view returns (uint8) {
        try IERCDecimals(token).decimals() returns (uint8 decimals) {
            return decimals;
        } catch (bytes memory) {
            return 18;
        }
    }

    function normalizeTo18Decimals(uint256 amount, uint8 decimals) public pure returns (uint256) {
        if (decimals < 18) {
            return amount * (10 ** (18 - decimals));
        } else if (decimals > 18) {
            return amount / (10 ** (decimals - 18));
        }
        return amount;
    }

    function calculateExchangeRate(
        uint256 amountIn,
        uint8 decimalsIn,
        uint256 amountOut,
        uint8 decimalsOut
    ) public pure returns (uint256) {
        uint256 amountInNormalized = normalizeTo18Decimals(amountIn, decimalsIn);
        uint256 amountOutNormalized = normalizeTo18Decimals(amountOut, decimalsOut);
        return (amountOutNormalized * (10 ** 18)) / amountInNormalized;
    }
}
