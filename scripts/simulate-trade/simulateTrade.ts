import { ethers } from "hardhat";
import { ARB_UTILS_ADDRESS, UNISWAP_V3_UTILS_ADDRESS, QUICKSWAP_V3_UTILS_ADDRESS, UNISWAP_V2_UTILS_ADDRESS, DEPLOYED_SCANNER_ADDRESS, WMATIC, USDC, USDT, USDCE } from "../../constants/Polygon";
import { encodeDexIdFee } from "../../utils/encodeDexIdFee";

//*********************** Simulate Trade *************************/
// This script queries the ArbitrageScannerV2 contract to simulate
// a the output of a trade path.
// 
// 
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

	//This will simulate a trade between USDT to USDCE to USDT
	const tokensPath = [USDT, USDCE, USDT];

	//Encode the dexIds and fees for each hop of the trade
	const hop1Dex = encodeDexIdFee(2, 3000); // Use UniswapV3 with 0.25% fee
	const hop2Dex = encodeDexIdFee(0, 25); // Use QuickSwapV2 with 0.3% fee

	const encodedExchanges = [hop1Dex, hop2Dex];
	const amountIn = ethers.parseUnits("10000", 6); // 10,000
	const tradeAmountOut = await contract.simulateTrade.staticCall(tokensPath, encodedExchanges, amountIn);
	const profit = tradeAmountOut - amountIn;
	console.log("Amount In: ", amountIn);
	console.log("Amount Out: ", tradeAmountOut);
	//Profit does not account for gas fees
	console.log("Profit: ", profit);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
