import { ethers } from "hardhat";
import { ARB_UTILS_ADDRESS, UNISWAP_V3_UTILS_ADDRESS, QUICKSWAP_V3_UTILS_ADDRESS, UNISWAP_V2_UTILS_ADDRESS, DEPLOYED_SCANNER_ADDRESS, POTENTIAL_PAIRS_ADDRESSES, POTENTIAL_PAIRS_INPUT_AMOUNTS, POTENTIAL_PAIRS_MAX_SLIPPAGE } from "../../constants/Polygon";

//************ Validate Tokens By Liquidity *********************/
// The goal of this script is to identify tokens for arbitrage
// opportunities based on their liquidity.
// Think of it like a filter for tokens that are worth checking.
//
// We do this by taking an array of token addresses were considering
// ("Prospect List") and return an array indicating if each token
// has enough liquidity to be considered valid.
//
// We first must create a "Potential Pairs" list that we will
// cross reference with the Prospect List.
//
// For each token in the Prospect List, we will check for liquidity
// pairs with each token in the Potential Pairs list on each dex.
//
// If the token has enough liquidity and meets the slippage requirements
// on any of the dexes, it is considered valid. We return the token address
// if it is valid, or the 0 address if it is not.
//
// The method has 5 parameters:
// 1. An array of token addresses to check for validity. ("Prospect List")
// 2. An array of dexIds to check for liquidity. (0 = QuickSwapV2, 1 = QuickSwapV3, 2 = UniswapV3)
// 3. An array of token addresses ("Potential Pairs") to be checked for liquidity with the Prospect List.
//    *The Potential Pairs list should be a list of tokens that are known to have liquidity on the dexes.
//    *This list should include tokens you are interested in accumulating. (USDC, USDT, WMATIC, WETH, etc.)
//
// 4. An array of input amounts for each token in the Potential Pairs list.
//    * For each token in the Potential Pairs list, you should specify the amount that should be used as the
//    * input amount to simulate a trade.
//    * This should also be denominated in the smallest unit based on the token's decimals.
//
// 5. An array of slippage amounts for each token in the Potential Pairs list.
//    * For each token in the Potential Pairs list, you should specify the maximum slippage amount
//    * that is acceptable. This should be a whole number (1000 = 1% slippage).
// 
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

	const dexIds = [0, 1, 2]; // Dex Ids you'd like to check.

	// Example tokens to be added to the Prospect List
	const wbtc = "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6";
	const link = "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39";
	const ric = "0x263026e7e53dbfdce5ae55ade22493f828922965";

	const tokensToCheck = [wbtc, link, ric];
	const results = await contract.validateTokens.staticCall(tokensToCheck, dexIds, POTENTIAL_PAIRS_ADDRESSES, POTENTIAL_PAIRS_INPUT_AMOUNTS, POTENTIAL_PAIRS_MAX_SLIPPAGE);
	// Convert the results to a set to remove duplicate 0 addresses
	// Potentially still need to filter out a single remaining 0 address
	const validResults = new Set(results);
	console.log("Valid Token Addresses: ", validResults);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
