import { bignumber, multiply, add, divide, mod, BigNumber } from 'mathjs';

export const encodeDexIdFee = (dexId: number, fee: number):string => {
	let bigExchangeId = bignumber(dexId);
	let bigFeeAmount = bignumber(fee);
	let shiftedExchangeId = multiply(bigExchangeId, bignumber(2).pow(17));
	let encodedValue = add(shiftedExchangeId, bigFeeAmount);
	return encodedValue.toString();
}

export const decodeDexIdFee = (encoded: string): Record<string, number> => {
	let bigEncodedValue = bignumber(encoded);
	const divisor = bignumber(2).pow(17);
	let originalExchangeId = divide(bigEncodedValue, divisor).toString();
	let decimalPointIndex = originalExchangeId.indexOf('.');
	if (decimalPointIndex !== -1) {
		originalExchangeId = originalExchangeId.substring(0, decimalPointIndex);
	}

	let originalFeeAmount = mod(bigEncodedValue, divisor).toNumber();
	// Return the original values
	return {
		exchangeId: Number(originalExchangeId),
		feeAmount: originalFeeAmount
	};
}

