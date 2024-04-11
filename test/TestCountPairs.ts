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


describe("Test Count Pairs", async function () {
	let arbitrageScannerAddress = "";
	it("Deploy Contract & Count Pairs", async function () {
		
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
	
		// Query the contract for the total number of pairs for each dex
		//( this method only works for V2 dexes, otherwise returns 0)
		const result = await contract.getTotalPairs(dexIds);
		console.log("Pair Counts: ", result);
		expect(result.length).to.equal(dexIds.length);
	});

});
