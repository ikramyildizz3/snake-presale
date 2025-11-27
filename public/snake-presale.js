// Snake Presale Web3 integration
// REQUIREMENTS:
// 1) snake-token.html içinde, bu dosyadan ÖNCE şu scripti ekle:
//    <script src="https://cdn.ethers.io/lib/ethers-5.2.umd.min.js" type="application/javascript"></script>
// 2) Mevcut ana JS dosyanızdan (site mantığı) SONRA şu scripti ekleyin:
//    <script src="/snake-presale.js"></script>
// Bu dosya mevcut placeholder alert'leri kaldırıp gerçek satın alma & claim işlemlerini ekler.

(function () {
  // Ağ ve kontrat sabitleri
  const BSC_CHAIN_ID = 56; // BNB Smart Chain mainnet

  const SNAKE_TOKEN_ADDRESS = "0xc9F46963Ee83EFd45675867f622Dd3a0B7c494e7";
  const PRESALE_ADDRESS = "0xbA073B1ec8fa5d7521E1592E03F08f1F272A7f5A";
  const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

  // Şimdilik panel sadece Normal Presale (no vesting) için çalışsın
  const CURRENT_POOL_ID = 0; // 0 = normal, 1 = vesting

  // Ethers v5 için minimal ABI'ler
  const PRESALE_ABI = [
    "function buyWithBNB(uint8 poolId, uint256 tokenAmount) payable",
    "function buyWithUSDT(uint8 poolId, uint256 tokenAmount, uint256 maxUSDT)",
    "function getBNBAmountForTokens(uint8 poolId, uint256 tokenAmount) view returns (uint256)",
    "function getUSDTAmountForTokens(uint8 poolId, uint256 tokenAmount) view returns (uint256)",
    "function getClaimableAmount(address user, uint8 poolId) view returns (uint256)"
  ];

  const ERC20_ABI = [
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 value) returns (bool)"
  ];

  let provider = null;
  let signer = null;
  let userAddress = null;

  let connectBtnEl = null;
  let buyBtnEl = null;
  let claimBtnEl = null;

  // ---------- Yardımcılar ----------

  function shortenAddress(addr) {
    if (!addr) return "";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  }

  function setButtonLoading(btn, isLoading, defaultText) {
    if (!btn) return;
    if (isLoading) {
      btn.disabled = true;
      btn.dataset.originalText = btn.dataset.originalText || btn.innerText;
      btn.innerText = defaultText || "Processing...";
    } else {
      btn.disabled = false;
      if (btn.dataset.originalText) {
        btn.innerText = btn.dataset.originalText;
      }
    }
  }

  function logErrorContext(prefix, error) {
    console.error(prefix, error);
    const message = (error && (error.data && error.data.message)) ||
                    (error && error.message) ||
                    String(error);
    alert(prefix + ": " + message);
  }

  // Mevcut event listener'ları temizlemek için butonu klonla
  function replaceButtonAndAttach(selector, handler) {
    const oldBtn = document.querySelector(selector);
    if (!oldBtn) return null;

    const newBtn = oldBtn.cloneNode(true);
    if (newBtn && newBtn.parentNode == null && oldBtn.parentNode) {
      // Çok nadir ama güvenlik için
      oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    } else if (oldBtn.parentNode) {
      oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    }

    // Çeviri sistemi buton yazısını tekrar yazmasın diye data-translate'i kaldırabiliriz
    if (newBtn.hasAttribute("data-translate")) {
      newBtn.removeAttribute("data-translate");
    }

    newBtn.addEventListener("click", function (e) {
      e.preventDefault();
      handler(e);
    });

    return newBtn;
  }

  function getCurrentPaymentMethod() {
    try {
      // Mevcut global değişkeni kullan (app.js içinde tanımlı)
      if (typeof currentPaymentMethod !== "undefined") {
        return currentPaymentMethod;
      }
    } catch (e) {
      // yoksa DOM'dan oku
    }
    const activeBtn = document.querySelector(".payment-btn.active");
    if (activeBtn && activeBtn.getAttribute("data-method")) {
      return activeBtn.getAttribute("data-method");
    }
    return "usdt";
  }

  function getSnakeAmount() {
    const input = document.getElementById("snakeAmount");
    if (!input) {
      alert("Amount input not found.");
      return null;
    }
    const raw = (input.value || "").trim();
    const value = parseFloat(raw);
    if (!raw || isNaN(value) || value <= 0) {
      alert("Please enter a valid SNAKE amount.");
      return null;
    }
    return raw; // string olarak döndürüyoruz, parseUnits için
  }

  function updateSummaryOnSuccess(amountStr) {
    try {
      const youReceive = document.getElementById("youReceive");
      if (youReceive) {
        youReceive.textContent = amountStr + " SNAKE";
      }
    } catch (e) {
      console.warn("Summary update failed:", e);
    }
  }

  // ---------- Web3 / Ethers ----------

  async function ensureProvider() {
    if (!window.ethereum) {
      alert("No Web3 wallet detected. Please install MetaMask, Trust Wallet browser, Binance Web3 etc.");
      throw new Error("No ethereum provider");
    }
    if (typeof ethers === "undefined" || !ethers.providers) {
      alert("Ethers.js not found. Make sure the ethers UMD script is included before snake-presale.js.");
      throw new Error("No ethers library");
    }

    if (!provider) {
      provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    }
    return provider;
  }

  async function ensureCorrectNetwork() {
    const p = await ensureProvider();
    const network = await p.getNetwork();
    if (network.chainId === BSC_CHAIN_ID) {
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }] // 56
      });
    } catch (switchError) {
      console.error("Failed to switch to BSC:", switchError);
      alert("Please switch your wallet to BNB Smart Chain (chainId 56) and try again.");
      throw switchError;
    }
  }

  async function connectWallet() {
    await ensureProvider();
    await ensureCorrectNetwork();

    const accounts = await provider.send("eth_requestAccounts", []);
    if (!accounts || accounts.length === 0) {
      throw new Error("No account selected");
    }

    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    if (connectBtnEl) {
      connectBtnEl.innerText = shortenAddress(userAddress);
      connectBtnEl.classList.add("connected");
    }

    console.log("Connected wallet:", userAddress);
    return userAddress;
  }

  function getPresaleContract() {
    if (!signer) {
      throw new Error("Wallet not connected");
    }
    return new ethers.Contract(PRESALE_ADDRESS, PRESALE_ABI, signer);
  }

  function getUsdtContract() {
    if (!signer) {
      throw new Error("Wallet not connected");
    }
    return new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
  }

  // ---------- İş mantığı: BUY ----------

  async function handleBuyNow() {
    try {
      if (!signer || !userAddress) {
        await connectWallet();
      }

      const amountStr = getSnakeAmount();
      if (!amountStr) return;

      const method = getCurrentPaymentMethod(); // "usdt" veya "bnb"
      const presale = getPresaleContract();

      // 18 decimal SNAKE
      const tokenAmount = ethers.utils.parseUnits(amountStr, 18);

      if (buyBtnEl) {
        setButtonLoading(buyBtnEl, true, "Processing...");
      }

      if (method === "bnb") {
        // Gerekli minimum BNB'yi kontrattan al
        const requiredBNB = await presale.getBNBAmountForTokens(CURRENT_POOL_ID, tokenAmount);

        // Küçük bir buffer ile gönder (1% fazla), fazla olanı kontrat refund ediyor
        const bufferedBNB = requiredBNB.mul(101).div(100);

        console.log("BNB required:", requiredBNB.toString(), "with buffer:", bufferedBNB.toString());

        const tx = await presale.buyWithBNB(CURRENT_POOL_ID, tokenAmount, {
          value: bufferedBNB
        });

        alert("Transaction sent. Waiting for confirmation...");
        await tx.wait();
        alert("Purchase successful!");

      } else {
        // USDT ile satın alma
        const requiredUSDT = await presale.getUSDTAmountForTokens(CURRENT_POOL_ID, tokenAmount);
        console.log("USDT required:", requiredUSDT.toString());

        const usdt = getUsdtContract();

        // Allowance kontrol
        const allowance = await usdt.allowance(userAddress, PRESALE_ADDRESS);
        if (allowance.lt(requiredUSDT)) {
          const approveTx = await usdt.approve(PRESALE_ADDRESS, requiredUSDT);
          alert("Approving USDT spend... Please confirm in your wallet.");
          await approveTx.wait();
        }

        const tx = await presale.buyWithUSDT(CURRENT_POOL_ID, tokenAmount, requiredUSDT);
        alert("Transaction sent. Waiting for confirmation...");
        await tx.wait();
        alert("Purchase successful!");
      }

      updateSummaryOnSuccess(amountStr);

    } catch (error) {
      logErrorContext("Purchase failed", error);
    } finally {
      if (buyBtnEl) {
        setButtonLoading(buyBtnEl, false);
      }
    }
  }

  // ---------- İş mantığı: CLAIM ----------

  async function handleClaim() {
    try {
      if (!signer || !userAddress) {
        await connectWallet();
      }

      const presale = getPresaleContract();

      const claimable = await presale.getClaimableAmount(userAddress, CURRENT_POOL_ID);
      console.log("Claimable:", claimable.toString());

      if (claimable.lte(0)) {
        alert("You have no claimable SNAKE yet. Claim opens ~2 days before TGE / listing.");
        return;
      }

      if (claimBtnEl) {
        setButtonLoading(claimBtnEl, true, "Claiming...");
      }

      const tx = await presale.claim(CURRENT_POOL_ID);
      alert("Claim transaction sent. Waiting for confirmation...");
      await tx.wait();

      alert("Claim successful! Your SNAKE has been sent to your wallet.");

    } catch (error) {
      logErrorContext("Claim failed", error);
    } finally {
      if (claimBtnEl) {
        setButtonLoading(claimBtnEl, false);
      }
    }
  }

  // ---------- Ethereum event listener'ları ----------

  function setupEthereumEvents() {
    if (!window.ethereum) return;

    window.ethereum.on && window.ethereum.on("accountsChanged", (accounts) => {
      console.log("accountsChanged:", accounts);
      if (!accounts || accounts.length === 0) {
        signer = null;
        userAddress = null;
        if (connectBtnEl) {
          connectBtnEl.innerText = "Connect Wallet";
          connectBtnEl.classList.remove("connected");
        }
      } else {
        userAddress = accounts[0];
        if (connectBtnEl) {
          connectBtnEl.innerText = shortenAddress(userAddress);
        }
      }
    });

    window.ethereum.on && window.ethereum.on("chainChanged", (chainId) => {
      console.log("chainChanged:", chainId);
      // Basit yaklaşım: ağ değiştiyse sayfayı yenileyelim
      window.location.reload();
    });
  }

  // ---------- Başlatma ----------

  function initSnakePresaleWeb3() {
    // Sadece snake-token sayfasında çalışsın
    if (!document.querySelector(".payment-methods")) {
      return;
    }

    // Mevcut placeholder click handler'ları kaldırmak için butonları klonluyoruz
    connectBtnEl = replaceButtonAndAttach(".connect-wallet", async () => {
      try {
        await connectWallet();
      } catch (error) {
        logErrorContext("Connect failed", error);
      }
    });

    buyBtnEl = replaceButtonAndAttach(".btn-primary", () => {
      handleBuyNow();
    });

    claimBtnEl = replaceButtonAndAttach(".btn-secondary", () => {
      handleClaim();
    });

    setupEthereumEvents();

    // Debug için global'e de ekleyelim
    window.snakePresaleWeb3 = {
      connectWallet,
      buyNow: handleBuyNow,
      claim: handleClaim
    };

    console.log("Snake presale web3 integration initialized.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSnakePresaleWeb3);
  } else {
    initSnakePresaleWeb3();
  }
})();