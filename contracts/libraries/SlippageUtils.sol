// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

library SlippageUtils {
    function calculateSlippagePercentage(uint256 expectedOut, uint256 actualOut) public pure returns (uint256) {
        if (expectedOut > actualOut) {
            uint256 difference = expectedOut - actualOut;
            uint256 slippagePercentage = (difference * 10000) / expectedOut;
            return slippagePercentage;
        } else {
            return 0;
        }
    }
}
