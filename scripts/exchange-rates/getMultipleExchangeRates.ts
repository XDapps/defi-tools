import { ethers } from "hardhat";
import { ARB_UTILS_ADDRESS, UNISWAP_V3_UTILS_ADDRESS, QUICKSWAP_V3_UTILS_ADDRESS, UNISWAP_V2_UTILS_ADDRESS, DEPLOYED_SCANNER_ADDRESS, WMATIC, USDC, USDT, USDCE, WETH, POTENTIAL_PAIRS_ADDRESSES, POTENTIAL_PAIRS_INPUT_AMOUNTS } from '../../constants/Polygon';
import { decodeDexIdFee, encodeDexIdFee } from "../../utils/encodeDexIdFee";
import { bignumber } from "mathjs";

//*********************** Get Multiple Exchange Rates **********************/
// This script queries the ArbitrageScannerV2 contract to get the
// exchange rates for a specific base asset vs multiple quote assets
//
// You must provide an input token, an array of quote tokens
// an array of input amounts(one for each quote token), and an encoded exchange
//
// The method will return an array of exchange rates for each quote token by dex.
// There will be an exchange rate for each quote token on each encoded dex
// If you pass in 3 quote tokens and 2 dexes, you will get 6 exchange rates
// If an exchange does not have a pool, the exchange rate will be 0
//
// After the trades are simulated, the amounts are adjusted for
// decimals and then the exchange rates are calculated
//
// The exchange rates are NOT the expected amount of output token
// The exchange rates ARE the amount of output token that would be
//  received assuming 1 full unit of the input token(adjusted for decimals) was swapped
// (Slippage is determined by the input amount)

// Example: Get the exchange rate for 0.1 WBTC to USDC on Uniswap V3 with a 500 fee
// The slippage will be calculated based on the trade size of 0.1 WBTC
// The exchange rate will be extrapolated to the amount of USDC received assuming 1 full WBTC input

// The goal of the exchange rate is to allow arbitrage opportunities to be calculated
// with normalized exchange rates. This simplifies and normalizes exchange rates for
// potential arbitrage opportunities.

// You may adjust the input amounts as you optimize your arbitrage strategy

//******************************************************************/


const findArrayIndex = (array1Count: number, array2Count: number, currentIndex: number): number => {
	if (currentIndex < 0 || currentIndex >= array1Count * array2Count) {
		throw new Error(`Invalid index ${currentIndex}`);
	}
	// Calculate the index in array1 for the current index in the output array
	const indexInArray1: number = Math.floor(currentIndex / array2Count);
	return indexInArray1;
}


async function main() {
	//Connect to the ArbitrageScannerV2 contract
	const ArbitrageScannerV2Factory = await ethers.getContractFactory("ArbitrageScannerV2", {
		libraries: {
			ArbUtils: ARB_UTILS_ADDRESS,
			UniswapV3Utils: UNISWAP_V3_UTILS_ADDRESS,
			QuickswapV3Utils: QUICKSWAP_V3_UTILS_ADDRESS,
			UniswapV2Utils: UNISWAP_V2_UTILS_ADDRESS
		},
	});
	const contract = new ethers.Contract(DEPLOYED_SCANNER_ADDRESS, ArbitrageScannerV2Factory.interface, ethers.provider);

	const baseAssetWbtc = "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6";
	const baseAssetInputAmount = ethers.parseUnits("0.145", 8);

	// Encode the dexIds and fees to be checked
	const quickSwapV2EncodedFee25 = encodeDexIdFee(0, 25); 
	const quickSwapV3EncodedFee3000 = encodeDexIdFee(1, 3000);
	const uniswapV3Fee10000 = encodeDexIdFee(2, 10000);
	const uniswapV3Fee3000 = encodeDexIdFee(2, 3000);
	const uniswapV3EncodedFee500 = encodeDexIdFee(2, 500);

	const encodedExchanges = [quickSwapV2EncodedFee25, quickSwapV3EncodedFee3000, uniswapV3Fee10000, uniswapV3Fee3000, uniswapV3EncodedFee500];

	const [exchangeRates, reverseRates, poolAddresses] = await contract.getMultipleExchangeRatesBoth.staticCall(baseAssetWbtc, baseAssetInputAmount, POTENTIAL_PAIRS_ADDRESSES, POTENTIAL_PAIRS_INPUT_AMOUNTS, encodedExchanges);

	// Decode the results
	let exchangeIndexCounter = 0;
	for (let i = 0; i < exchangeRates.length; i++) {
		const encodedExchange = encodedExchanges[exchangeIndexCounter];
		exchangeIndexCounter++;
		if (exchangeIndexCounter === encodedExchanges.length) {
			exchangeIndexCounter = 0;
		}
		const exchangeRate = bignumber(exchangeRates[i].toString());
		const reverseExchangeRate = bignumber(reverseRates[i].toString());

		if (exchangeRate.equals(0) || reverseExchangeRate.equals(0)) continue;

		const addressIndex = findArrayIndex(POTENTIAL_PAIRS_ADDRESSES.length, encodedExchanges.length, i);
		const potentialPairAddress = POTENTIAL_PAIRS_ADDRESSES[addressIndex];

		const decodedExchange = decodeDexIdFee(encodedExchange);
		const exchangeId = decodedExchange.exchangeId;
		const feeAmount = decodedExchange.feeAmount;
		const poolAddress = poolAddresses[i].toLowerCase();

		console.log(`DexId ${exchangeId} fee ${feeAmount} poolAddress ${poolAddress}`);
		console.log(`Base Asset ${baseAssetWbtc} to ${potentialPairAddress}: ${exchangeRate.toString()}`);
		console.log(`Base Asset ${potentialPairAddress} to ${baseAssetWbtc}: ${reverseExchangeRate.toString()}`);
		console.log("");
		console.log(`<-------------Next Route------------->`);
		console.log("");
	};
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
