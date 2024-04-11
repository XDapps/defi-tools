import { ethers } from "hardhat";

async function main() {

	let decimalUtilsAddress = "0x66251624649E0DaC7E1BF53A98cDDafed896e8b8";
	let slippageUtilsAddress = "0xedafdb092A50cE56488ad679fDe35396dE7cEEa2";

	let uniswapV3UtilsAddress = "0x8183a36Cd907C6c0302B14FcD53432786D300B35";

	const UniswapV3UtilsFactory = await ethers.getContractFactory("UniswapV3Utils", {
		libraries: {
			DecimalUtils: decimalUtilsAddress,
			SlippageUtils: slippageUtilsAddress
		}
	});


	try {
		const uniswapV3Utils = await UniswapV3UtilsFactory.deploy();
		uniswapV3UtilsAddress = await uniswapV3Utils.getAddress();
		console.log("UniswapV3 utils library deployed to:", uniswapV3UtilsAddress);

	} catch (error) {
		console.error("Error deploying contract", error);
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
