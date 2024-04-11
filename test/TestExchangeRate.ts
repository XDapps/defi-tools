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
	UNISWAP_V3_FACTORY_ADDRESS,
	USDC

 } from "../constants/Polygon";
import { encodeDexIdFee } from "../utils/encodeDexIdFee";

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


describe("Get Exchange Rate", async function () {
	let arbitrageScannerAddress = "";
	it("Deploy & Get Exchange Rate", async function () {

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


		// Query to get the exchange rate between two tokens
		// You must provide an input token, output token, input amount, and a fee
		// The trade will be simulated based on the input amount
		// After the trade is simulated, the amounts are adjusted for
		// decimals and then the exchange rate is calculated
		// The exchange rate is NOT the expected amount of output token
		// The exchange rate IS the amount of output token that would be
		//  received assuming 1 full unit of the input token(adjusted for decimals) was swapped
		// (Slippage is determined by the input amount)
		
		// Example: Get the exchange rate for 0.1 WBTC to USDC on Uniswap V3 with a 500 fee
		// The slippage will be calculated based on the trade size of 0.1 WBTC
		// The exchange rate will be extrapolated to the amount of USDC received assuming 1 full WBTC input

		// The goal of the exchange rate is to allow arbitrage opportunities to be calculated
		// with normalized exchange rates. This allows for more accurate calculations

		// You may adjust the input amounts as you optimize your arbitrage strategy
		

		const wbtc = "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6";
		const btcAmountIn = ethers.parseUnits("0.1", 8);
		const uniswapV3EncodedFee500 = encodeDexIdFee(2, 500);
		const results = await contract.getExchangeRate.staticCall(wbtc, USDC, btcAmountIn, uniswapV3EncodedFee500);
		const exchangeRate = results[0];
		const poolAddress = results[1];		
		console.log("Pool Address: ", poolAddress);
		console.log("Amount Received based on 1 full unit of the input currency: ", exchangeRate);
		expect(exchangeRate).to.be.greaterThan(0);
	});

});
