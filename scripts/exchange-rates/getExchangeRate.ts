import { ethers } from "hardhat";
import { ARB_UTILS_ADDRESS, UNISWAP_V3_UTILS_ADDRESS, QUICKSWAP_V3_UTILS_ADDRESS, UNISWAP_V2_UTILS_ADDRESS, DEPLOYED_SCANNER_ADDRESS, WMATIC, USDC, USDT, USDCE } from "../../constants/Polygon";
import { encodeDexIdFee } from "../../utils/encodeDexIdFee";

//*********************** Get Exchange Rate **********************/
// This script queries the ArbitrageScannerV2 contract to get the
// exchange rate for a specific pair based on a specific input amount.
//
// You must provide an input token, output token, input amount, and a fee
// The trade will be simulated based on the input amount
//
// After the trade is simulated, the amounts are adjusted for
// decimals and then the exchange rate is calculated
//
// The exchange rate is NOT the expected amount of output token
// The exchange rate IS the amount of output token that would be
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

	const wbtc = "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6";
	const btcAmountIn = ethers.parseUnits("0.1", 8);
	const uniswapV3EncodedFee500 = encodeDexIdFee(2, 500);
	const results = await contract.getExchangeRate.staticCall(wbtc, USDC, btcAmountIn, uniswapV3EncodedFee500);
	const exchangeRate = results[0];
	const poolAddress = results[1];
	console.log("Pool Address: ", poolAddress);
	console.log("Amount Received based on 1 full unit of the input currency: ", exchangeRate);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
