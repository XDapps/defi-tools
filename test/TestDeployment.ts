import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import { QUICKSWAP_V2_FACTORY_ADDRESS, 
	QUICKSWAP_V2_QUOTER_ADDRESS, 
	QUICKSWAP_V2_ROUTER_ADDRESS,
	QUICKSWAP_V2_FEES,
	QUICKSWAP_V2_PROTOCOL,
	QUICKSWAP_V3_FACTORY_ADDRESS,
	QUICKSWAP_V3_PROTOCOL,
	UNISWAP_V3_PROTOCOL,
	QUICKSWAP_V3_ROUTER_ADDRESS,
	UNISWAP_V3_ROUTER_ADDRESS,
	QUICKSWAP_V3_QUOTER_ADDRESS,
	UNISWAP_V3_QUOTER_ADDRESS,
	QUICKSWAP_V3_FEES,
	UNISWAP_V3_FEES,
	UNISWAP_V3_FACTORY_ADDRESS

 } from "../constants/Polygon";
import { bignumber } from "mathjs";

const dexIds = [0, 1, 2];
const dexProtocols: number[] = [QUICKSWAP_V2_PROTOCOL, QUICKSWAP_V3_PROTOCOL, UNISWAP_V3_PROTOCOL];
const dexFactories: string[] = [QUICKSWAP_V2_FACTORY_ADDRESS, QUICKSWAP_V3_FACTORY_ADDRESS, UNISWAP_V3_FACTORY_ADDRESS];
const dexRouters: string[] = [QUICKSWAP_V2_ROUTER_ADDRESS, QUICKSWAP_V3_ROUTER_ADDRESS, UNISWAP_V3_ROUTER_ADDRESS];
const dexQuoters: string[] = [QUICKSWAP_V2_QUOTER_ADDRESS, QUICKSWAP_V3_QUOTER_ADDRESS, UNISWAP_V3_QUOTER_ADDRESS];
const dexFees: number[][] = [QUICKSWAP_V2_FEES, QUICKSWAP_V3_FEES, UNISWAP_V3_FEES];

let arbUtilsAddress = "";
let decimalUtilsAddress = "";
let slippageUtilsAddress = "";
let uniswapV3UtilsAddress = "";
let quickSwapV3UtilsAddress = "";
let uniSwapV2UtilsAddress = "";


describe("Test Contract Deployment", async function () {
	let arbitrageScannerAddress = "";
	it("Deploy Contract", async function () {
		const [owner] = await ethers.getSigners();

		//Deploy the base libraries first
		const ArbUtilsFactory = await ethers.getContractFactory("ArbUtils");
		const DecimalUtilsFactory = await ethers.getContractFactory("DecimalUtils");
		const SlippageUtilsFactory = await ethers.getContractFactory("SlippageUtils");

		const arbUtils = await ArbUtilsFactory.deploy();
		arbUtilsAddress = await arbUtils.getAddress();
		const decimalUtils = await DecimalUtilsFactory.deploy();
		decimalUtilsAddress = await decimalUtils.getAddress();
		const slippageUtils = await SlippageUtilsFactory.deploy();
		slippageUtilsAddress = await slippageUtils.getAddress();

		//Deploy the Exchange Utils libraries
		const UniswapV3UtilsFactory = await ethers.getContractFactory("UniswapV3Utils", {
			libraries: {
				DecimalUtils: decimalUtilsAddress,
				SlippageUtils: slippageUtilsAddress
			}
		});
		const uniswapV3Utils = await UniswapV3UtilsFactory.deploy();
		uniswapV3UtilsAddress = await uniswapV3Utils.getAddress();

		const QuickSwapV3UtilsFactory = await ethers.getContractFactory("QuickswapV3Utils", {
			libraries: {
				DecimalUtils: decimalUtilsAddress,
				SlippageUtils: slippageUtilsAddress
			}
		});
		const quickSwapV3Utils = await QuickSwapV3UtilsFactory.deploy();
		quickSwapV3UtilsAddress = await quickSwapV3Utils.getAddress();

		const UniswapV2UtilsFactory = await ethers.getContractFactory("UniswapV2Utils", {
			libraries: {
				DecimalUtils: decimalUtilsAddress,
				SlippageUtils: slippageUtilsAddress
			}
		});
		const uniSwapV2Utils = await UniswapV2UtilsFactory.deploy();
		uniSwapV2UtilsAddress = await uniSwapV2Utils.getAddress();

		// Log All Addresses
		console.log("Arb Utils library deployed to:", arbUtilsAddress);
		console.log("Decimal Utils library deployed to:", decimalUtilsAddress);
		console.log("Slippage Utils library deployed to:", slippageUtilsAddress);
		console.log("UniswapV3 Utils library deployed to:", uniswapV3UtilsAddress);
		console.log("QuickSwapV3 Utils library deployed to:", quickSwapV3UtilsAddress);
		console.log("UniswapV2 Utils library deployed to:", uniSwapV2UtilsAddress);

		// Deploy the Arbitrage Scanner contract using the libraries
		const ArbitrageScannerFactory = await ethers.getContractFactory("ArbitrageScanner", {
			libraries: {
				ArbUtils: arbUtilsAddress,
				UniswapV3Utils: uniswapV3UtilsAddress,
				QuickswapV3Utils: quickSwapV3UtilsAddress,
				UniswapV2Utils: uniSwapV2UtilsAddress
			},
		});

		const contract = await upgrades.deployProxy(ArbitrageScannerFactory, [dexIds, dexProtocols, dexFactories, dexRouters, dexQuoters, dexFees], { initializer: 'initializeContract' });
		arbitrageScannerAddress = await contract.getAddress();
		console.log("Scanner Contract deployed to address:", arbitrageScannerAddress);

		const dex0Factory = await contract.factories(0);
		const dex1Factory = await contract.factories(1);
		const dex2Factory = await contract.factories(2);
		
		expect(dex0Factory).to.equal(QUICKSWAP_V2_FACTORY_ADDRESS);
		expect(dex1Factory).to.equal(QUICKSWAP_V3_FACTORY_ADDRESS);
		expect(dex2Factory).to.equal(UNISWAP_V3_FACTORY_ADDRESS);
		
		const dex0Router = await contract.routers(0);
		const dex1Router = await contract.routers(1);
		const dex2Router = await contract.routers(2);
		
		expect(dex0Router).to.equal(QUICKSWAP_V2_ROUTER_ADDRESS);
		expect(dex1Router).to.equal(QUICKSWAP_V3_ROUTER_ADDRESS);
		expect(dex2Router).to.equal(UNISWAP_V3_ROUTER_ADDRESS);
		
		const dex0Quoter = await contract.quoters(0);
		const dex1Quoter = await contract.quoters(1);
		const dex2Quoter = await contract.quoters(2);
		
		expect(dex0Quoter).to.equal(QUICKSWAP_V2_QUOTER_ADDRESS);
		expect(dex1Quoter).to.equal(QUICKSWAP_V3_QUOTER_ADDRESS);
		expect(dex2Quoter).to.equal(UNISWAP_V3_QUOTER_ADDRESS);
		
		const dex0Protocol = await contract.protocol(0);
		const dex1Protocol = await contract.protocol(1);
		const dex2Protocol = await contract.protocol(2);

		expect(dex0Protocol).to.equal(QUICKSWAP_V2_PROTOCOL);
		expect(dex1Protocol).to.equal(QUICKSWAP_V3_PROTOCOL);
		expect(dex2Protocol).to.equal(UNISWAP_V3_PROTOCOL);

	});

});
