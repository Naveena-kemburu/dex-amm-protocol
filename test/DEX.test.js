const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DEX", function () {
  let dex, tokenA, tokenB;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    tokenA = await MockERC20.deploy("Token A", "TKA");
    tokenB = await MockERC20.deploy("Token B", "TKB");
    
    const DEX = await ethers.getContractFactory("DEX");
    dex = await DEX.deploy(tokenA.address, tokenB.address);
    
    await tokenA.approve(dex.address, ethers.utils.parseEther("1000000"));
    await tokenB.approve(dex.address, ethers.utils.parseEther("1000000"));
  });

  describe("Liquidity Management", function () {
    it("should allow initial liquidity provision", async function () {
      await expect(dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200")))
        .to.emit(dex, "LiquidityAdded");
    });

    it("should mint correct LP tokens for first provider", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const lp = await dex.liquidity(owner.address);
      expect(lp.gt(0)).to.be.true;
    });

    it("should allow subsequent liquidity additions", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      await expect(dex.addLiquidity(ethers.utils.parseEther("50"), ethers.utils.parseEther("100")))
        .to.emit(dex, "LiquidityAdded");
    });

    it("should maintain price ratio on liquidity addition", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const [reserveA1, reserveB1] = await dex.getReserves();
      const ratio1 = reserveB1.mul(ethers.utils.parseEther("1")).div(reserveA1);
      
      await dex.addLiquidity(ethers.utils.parseEther("50"), ethers.utils.parseEther("100"));
      const [reserveA2, reserveB2] = await dex.getReserves();
      const ratio2 = reserveB2.mul(ethers.utils.parseEther("1")).div(reserveA2);
      expect(ratio1).to.equal(ratio2);
    });

    it("should allow partial liquidity removal", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const lp = await dex.liquidity(owner.address);
      await expect(dex.removeLiquidity(lp.div(2)))
        .to.emit(dex, "LiquidityRemoved");
    });

    it("should return correct token amounts on liquidity removal", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const lp = await dex.liquidity(owner.address);
      const [amountA, amountB] = await dex.removeLiquidity(lp);
      expect(amountA.gt(0)).to.be.true;
      expect(amountB.gt(0)).to.be.true;
    });

    it("should revert on zero liquidity addition", async function () {
      await expect(dex.addLiquidity(0, ethers.utils.parseEther("100")))
        .to.be.revertedWith("Amounts must be positive");
    });

    it("should revert when removing more liquidity than owned", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const lp = await dex.liquidity(owner.address);
      await expect(dex.removeLiquidity(lp.mul(2)))
        .to.be.revertedWith("Insufficient liquidity");
    });
  });

  describe("Token Swaps", function () {
    beforeEach(async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
    });

    it("should swap token A for token B", async function () {
      await expect(dex.swapAForB(ethers.utils.parseEther("10")))
        .to.emit(dex, "Swap");
    });

    it("should swap token B for token A", async function () {
      await expect(dex.swapBForA(ethers.utils.parseEther("20")))
        .to.emit(dex, "Swap");
    });

    it("should calculate correct output amount with fee", async function () {
      const amountOut = await dex.getAmountOut(
        ethers.utils.parseEther("10"),
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("200")
      );
      expect(amountOut.gt(0)).to.be.true;
    });

    it("should update reserves after swap", async function () {
      const [reserveA1, reserveB1] = await dex.getReserves();
      await dex.swapAForB(ethers.utils.parseEther("10"));
      const [reserveA2, reserveB2] = await dex.getReserves();
      expect(reserveA2.gt(reserveA1)).to.be.true;
      expect(reserveB2.lt(reserveB1)).to.be.true;
    });

    it("should increase k after swap due to fees", async function () {
      const [reserveA1, reserveB1] = await dex.getReserves();
      const k1 = reserveA1.mul(reserveB1);
      await dex.swapAForB(ethers.utils.parseEther("10"));
      const [reserveA2, reserveB2] = await dex.getReserves();
      const k2 = reserveA2.mul(reserveB2);
      expect(k2.gte(k1)).to.be.true;
    });

    it("should revert on zero swap amount", async function () {
      await expect(dex.swapAForB(0)).to.be.revertedWith("Amount must be positive");
    });

    it("should handle large swaps with high price impact", async function () {
      await expect(dex.swapAForB(ethers.utils.parseEther("500")))
        .to.emit(dex, "Swap");
    });

    it("should handle multiple consecutive swaps", async function () {
      await dex.swapAForB(ethers.utils.parseEther("10"));
      await dex.swapBForA(ethers.utils.parseEther("20"));
      await dex.swapAForB(ethers.utils.parseEther("5"));
      const [reserveA, reserveB] = await dex.getReserves();
      expect(reserveA.gt(0)).to.be.true;
      expect(reserveB.gt(0)).to.be.true;
    });
  });

  describe("Price Calculations", function () {
    it("should return correct initial price", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const price = await dex.getPrice();
      expect(price.gt(0)).to.be.true;
    });

    it("should update price after swaps", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const price1 = await dex.getPrice();
      await dex.swapAForB(ethers.utils.parseEther("10"));
      const price2 = await dex.getPrice();
      expect(price2.lt(price1)).to.be.true;
    });

    it("should handle price queries with zero reserves gracefully", async function () {
      await expect(dex.getPrice()).to.be.revertedWith("Reserve A is zero");
    });
  });

  describe("Fee Distribution", function () {
    it("should accumulate fees for liquidity providers", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const lp1 = await dex.liquidity(owner.address);
      await dex.swapAForB(ethers.utils.parseEther("10"));
      const [reserveA, reserveB] = await dex.getReserves();
      expect(reserveA.mul(reserveB).gte(ethers.utils.parseEther("100").mul(ethers.utils.parseEther("200")))).to.be.true;
    });

    it("should distribute fees proportionally to LP share", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      await dex.swapAForB(ethers.utils.parseEther("20"));
      const lp = await dex.liquidity(owner.address);
      const [amountA, amountB] = await dex.removeLiquidity(lp);
      expect(amountA.gte(ethers.utils.parseEther("100"))).to.be.true;
      expect(amountB.gte(ethers.utils.parseEther("200"))).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("should handle very small liquidity amounts", async function () {
      await expect(dex.addLiquidity("1", "1"))
        .to.emit(dex, "LiquidityAdded");
    });

    it("should handle very large liquidity amounts", async function () {
      await expect(dex.addLiquidity(ethers.utils.parseEther("999999"), ethers.utils.parseEther("999999")))
        .to.emit(dex, "LiquidityAdded");
    });

    it("should prevent unauthorized access", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      await tokenA.connect(addr1).approve(dex.address, ethers.utils.parseEther("1000"));
      await expect(dex.connect(addr1).removeLiquidity(ethers.utils.parseEther("1")))
        .to.be.revertedWith("Insufficient liquidity");
    });
  });

  describe("Events", function () {
    it("should emit LiquidityAdded event", async function () {
      await expect(dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200")))
        .to.emit(dex, "LiquidityAdded")
        .withArgs(owner.address, ethers.utils.parseEther("100"), ethers.utils.parseEther("200"), ethers.BigNumber.from(0));
    });

    it("should emit LiquidityRemoved event", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      const lp = await dex.liquidity(owner.address);
      await expect(dex.removeLiquidity(lp))
        .to.emit(dex, "LiquidityRemoved");
    });

    it("should emit Swap event", async function () {
      await dex.addLiquidity(ethers.utils.parseEther("100"), ethers.utils.parseEther("200"));
      await expect(dex.swapAForB(ethers.utils.parseEther("10")))
        .to.emit(dex, "Swap");
    });
  });
});
