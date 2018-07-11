var chai = require("chai");
var expect = chai.expect;

const BetKernel = artifacts.require("BetKernel");
const BetOracle = artifacts.require("BetOracle");
const BetPayments = artifacts.require("BetPayments");
const BetTerms = artifacts.require("BetTerms");
const BetRegistry = artifacts.require("BetRegistry");
// Bet Payments Proxy
const ERC721PaymentProxy = artifacts.require("ERC721PaymentProxy");
const DummyToken = artifacts.require("DummyERC721Token");
// BetTerms Proxy
const OwnerBased = artifacts.require("OwnerBased");
// BetOracle Proxy
const OwnerBasedOracle = artifacts.require("OwnerBasedOracle");

contract("Bet Kernel Test", async (accounts) => {
    var betKernel;
    var betOracle;
    var betPayments;
    var betTerms;
    var betRegistry;
    var betHash;
    var playerBetHash;
    // Bet Payments
    var erc721PaymentProxy;
    var token;
    // Bet Terms
    var ownerBased;
    var termsHash;
    // Bet Oracle
    var ownerBasedOracle;


    const CONTRACT_OWNER = accounts[0];

    const BETTER_1 = accounts[1];
    const BETTER_2 = accounts[2];
    const WINNER_1 = accounts[3];

    before(async () => {
        betKernel = await BetKernel.new();
        betPayments = await BetPayments.new();
        betOracle = await BetOracle.new();
        betTerms = await BetTerms.new();

        betRegistry = await BetRegistry.new(
            betKernel.address,
            betPayments.address,
            betOracle.address,
            betTerms.address
        );
        
        // Setting bet payments
        erc721PaymentProxy = await ERC721PaymentProxy.new();
        token = await DummyToken.new(
            5,
            "DummyToken",
            "DMT"
        );       
        await token.transferFrom(CONTRACT_OWNER, BETTER_1, 0);
        await token.transferFrom(CONTRACT_OWNER, BETTER_2, 1);
        // Setting the terms
        ownerBased = await OwnerBased.new();
        termsHash = await ownerBased.getTermsHash.call();
        // Setting the oracle
        ownerBasedOracle = await OwnerBasedOracle.new();
        // setting the proxies
        await betRegistry.setPaymentsProxiesAllowance(erc721PaymentProxy.address, true);
        await betRegistry.setOracleProxiesAllowance(ownerBasedOracle.address, true);
        await betRegistry.setTermsProxiesAllowance(ownerBased.address, true);

        // Creating the bet
        betHash = await betRegistry.createBet.call(
            erc721PaymentProxy.address,
            token.address,
            ownerBasedOracle.address,
            ownerBased.address,
            termsHash,
            web3.fromAscii("Hola Mundo"),
            1 // Salt
        );
        await betRegistry.createBet(
            erc721PaymentProxy.address,
            token.address,
            ownerBasedOracle.address,
            ownerBased.address,
            termsHash,
            web3.fromAscii("Hola Mundo"),
            1 // Salt
        );
    });

    it("should allow a user to place a bet", async () => {
        await betPayments.setBetRegistry(betRegistry.address);
        await betKernel.setBetRegistry(betRegistry.address);
        await token.approve(betPayments.address, 0, {from: BETTER_1});

        playerBetHash = await betKernel.placeBet.call(
            betHash,
            3,
            0,
            {from: BETTER_1}
        );

        await betKernel.placeBet(
            betHash,
            3,
            0,
            {from: BETTER_1}
        );
        let balance = await token.balanceOf(BETTER_1);
        expect(
            balance.toNumber()
        ).to.be.equal(0);
        balance = await token.balanceOf(betPayments.address);
        expect(
            balance.toNumber()
        ).to.be.equal(1);

    });

    it("should return the parameters of the player bet", async () => {
        const option = await betRegistry.getPlayerBetOption(betHash, playerBetHash);
        expect(
            option.toNumber()
        ).to.be.equal(3);
        expect(
            await betRegistry.getPlayerBetPlayer(betHash, playerBetHash)
        ).to.be.equal(BETTER_1)
    });

    /*
    it("should allow a user to get back the profits", async () => {
        // First -> Setting the oracle
        await ownerBasedOracle.setOutcome(betHash, 3);
        await ownerBasedOracle.setOutcomeReady(betHash, true);

        // Second -> Setting the terms
        await ownerBased.changePeriod(
            termsHash,
            2
        );
        // Third -> Asking for the profits
        const profits = await betKernel.getProfits.call(
            betHash,
            playerBetHash,
            {from: BETTER_1}
        );
        // const balance = await token.balanceOf(BETTER_1);
        expect(
            profits.toNumber()
        ).to.be.equal(1);
    });

    it("should return the proper amount in more complex bets", async () => {
        // Second -> Setting the terms
        await ownerBased.changePeriod(
            termsHash,
            0
        );
        await token.approve(betPayments.address, 5, {from: BETTER_2});

        let player2BetHash = await betKernel.placeBet.call(
            betHash,
            2,
            5,
            {from: BETTER_2}
        );
        await betKernel.placeBet(
            betHash,
            2,
            5,
            {from: BETTER_2}
        );

        await ownerBased.changePeriod(
            termsHash,
            2
        );
        let profits = await betKernel.getProfits.call(
            betHash,
            playerBetHash,
            {from: BETTER_1}
        );
        expect(
            profits.toNumber()
        ).to.be.equal(10);
        profits = await betKernel.getProfits.call(
            betHash,
            player2BetHash,
            {from: BETTER_2}
        );
        expect(
            profits.toNumber()
        ).to.be.equal(0);

    });

    it("should transfer the proper amount once a bet finalices", async () => {
        await betKernel.getProfits(
            betHash,
            playerBetHash,
            {from: BETTER_1}
        );
        const balance = await token.balanceOf(BETTER_1);
        expect(
            balance.toNumber()
        ).to.be.equal(10);
    });
    */
});
