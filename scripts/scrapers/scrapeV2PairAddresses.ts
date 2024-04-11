import { ethers } from "hardhat";
import { ARB_UTILS_ADDRESS, UNISWAP_V3_UTILS_ADDRESS, QUICKSWAP_V3_UTILS_ADDRESS, UNISWAP_V2_UTILS_ADDRESS, DEPLOYED_SCANNER_ADDRESS, QUICKSWAP_V2_FACTORY_ADDRESS } from "../../constants/Polygon";

//************ Scrape Pair Addresses Uniswap V2 *****************/
// This script queries the ArbitrageScannerV2 contract for the
// liquidity pool pairs by index for a UniswapV2 dex.
//
// You pass in a UniswapV2 factory address, a starting index and
// the qty of pairs you'd like to check.
// 
// The method will return two arrays of addresses:
// The first array is the pair addresses for each index.
// The second array is the token addresses for each pair.
// The token addresses array will be twice the size of the pair addresses array.
// pairAddresses[0] = pairAddress
// tokenAddresses[0] = token0Address
// tokenAddresses[1] = token1Address
// 
//*****************************************************************/

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

	const pairIndexToStartAt = 0;
	const numPairsToCheck = 5;
	const [pairAddresses, tokenAddresses] = await contract.getV2PairsAndTokens(QUICKSWAP_V2_FACTORY_ADDRESS, pairIndexToStartAt, numPairsToCheck);
	console.log("Pair Addresses: ", pairAddresses);
	console.log("Token Addresses: ", tokenAddresses);
	
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
