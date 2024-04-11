// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

library ArbUtils {
    uint24 constant FEE_MASK = 0x1FFFF; // 17 bits set to 1 for feeAmount
    uint24 constant SHIFT_BITS = 17; // Shift amount for exchangeId

    // Function to decode exchangeId from encoded value
    function decodeExchangeId(uint24 encodedValue) public pure returns (uint24) {
        uint24 result = encodedValue >> SHIFT_BITS;
        return result;
    }

    // Function to decode feeAmount from encoded value
    function decodeFeeAmount(uint24 encodedValue) public pure returns (uint24) {
        uint24 result = encodedValue & FEE_MASK;
        return result;
    }
}
