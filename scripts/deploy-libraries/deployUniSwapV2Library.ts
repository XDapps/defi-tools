import { ethers } from "hardhat";

async function main() {
	const [owner] = await ethers.getSigners();
	 let decimalUtilsAddress = "0x66251624649E0DaC7E1BF53A98cDDafed896e8b8";
	let slippageUtilsAddress = "0xedafdb092A50cE56488ad679fDe35396dE7cEEa2";

	let uniSwapV2UtilsAddress = "0x77103683893aAF702053AD1cD4A3E355FbD6E871";

	const UniswapV2UtilsFactory = await ethers.getContractFactory("UniswapV2Utils", {
		libraries: {
			DecimalUtils: decimalUtilsAddress,
			SlippageUtils: slippageUtilsAddress
		}
	});

	try {
		const uniSwapV2Utils = await UniswapV2UtilsFactory.deploy();
		uniSwapV2UtilsAddress = await uniSwapV2Utils.getAddress();
		console.log("UniSwapV2 utils library deployed to:", uniSwapV2UtilsAddress);
	} catch (error) {
		console.error("Error deploying contract", error);
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
