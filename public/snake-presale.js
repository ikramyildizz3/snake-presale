// Snake Presale Web3 integration
// REQUIREMENTS:
// 1) snake-token.html içinde, bu dosyadan ÖNCE şu scripti ekle:
//    <script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"></script>
// 2) Mevcut ana JS dosyanızdan (site mantığı) SONRA şu scripti ekleyin:
//    <script src="snake-presale.js"></script>

(function () {
  // Ağ ve kontrat sabitleri
  const BSC_CHAIN_ID = 56; // BNB Smart Chain mainnet

  const SNAKE_TOKEN_ADDRESS = "0xc9F46963Ee83EFd45675867f622Dd3a0B7c494e7";
  const PRESALE_ADDRESS     = "0xbA073B1ec8fa5d7521E1592E03F08f1F272A7f5A";
  const USDT_ADDRESS        = "0x55d398326f99059fF775485246999027B3197955";

  // Ethers v5 için minimal ABI'ler
  const PRESALE_ABI = [
    "function buyWithBNB(uint8 poolId, uint256 tokenAmount) payable",
    "function buyWithUSDT(uint8 poolId, uint256 tokenAmount, uint256 maxUSDT)",
    "function getBNBAmountForTokens(uint8 poolId, uint256 tokenAmount) view returns (uint256)",
    "function getUSDTAmountForTokens(uint8 poolId, uint256 tokenAmount) view returns (uint256)",
    "function getClaimableAmount(address user, uint8 poolId) view returns (uint256)",
    "function claim(uint8 poolId)"
  ];

  const ERC20_ABI = [
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 value) returns (bool)"
  ];

  let provider         = null;
  let signer           = null;
  let userAddress      = null;
  let injectedProvider = null;

  let connectBtnEl = null;
  let buyBtnEl     = null;
  let claimBtnEl   = null;

  let isConnectingWallet = false;

  // ---------- Dil yardımcıları ----------

  function getCurrentLang() {
    try {
      if (typeof window !== "undefined" && window.currentLanguage) {
        return window.currentLanguage;
      }
    } catch (e) {}
    return "en";
  }

  function t(en, tr) {
    const lang = getCurrentLang();
    if (lang === "tr" && typeof tr === "string") return tr;
    return en;
  }

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
      btn.innerText = defaultText || t("Processing...", "İşlem yapılıyor...");
    } else {
      btn.disabled = false;
      if (btn.dataset.originalText) {
        btn.innerText = btn.dataset.originalText;
      }
    }
  }

  function logErrorContext(prefixKey, error) {
    console.error(prefixKey, error);

    const rawMessage =
      (error && error.message) ||
      (error && error.data && error.data.message) ||
      "";

    const lower = (rawMessage || "").toLowerCase();
    if (
      error &&
      (error.code === 4001 ||
        lower.includes("user rejected") ||
        lower.includes("rejected the transaction"))
    ) {
      alert(
        t(
          "Transaction cancelled in wallet.",
          "İşlem cüzdanda iptal edildi."
        )
      );
      return;
    }

    let message = rawMessage;
    if (!message) {
      message = t(
        "Something went wrong. Please check your wallet and try again.",
        "Bir hata oluştu. Lütfen cüzdanınızı kontrol edip tekrar deneyin."
      );
    } else if (message.length > 200) {
      message = message.slice(0, 200) + "...";
    }

    let prefixText = prefixKey;
    if (prefixKey === "Purchase failed") {
      prefixText = t(
        "Purchase failed",
        "Satın alma işlemi başarısız"
      );
    } else if (prefixKey === "Claim failed") {
      prefixText = t("Claim failed", "Claim işlemi başarısız");
    }

    alert(prefixText + ": " + message);
  }

  // Mevcut event listener'ları temizlemek için butonu klonla
  function replaceButtonAndAttach(selector, handler) {
    const oldBtn = document.querySelector(selector);
    if (!oldBtn) return null;

    const newBtn = oldBtn.cloneNode(true);

    if (oldBtn.parentNode) {
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
      if (typeof currentPaymentMethod !== "undefined") {
        return currentPaymentMethod;
      }
    } catch (e) {}
    const activeBtn = document.querySelector(".payment-btn.active");
    if (activeBtn && activeBtn.getAttribute("data-method")) {
      return activeBtn.getAttribute("data-method");
    }
    return "usdt";
  }

  function getCurrentPoolId() {
    try {
      if (typeof window !== "undefined" && typeof window.currentSalePool !== "undefined") {
        return window.currentSalePool === 1 ? 1 : 0;
      }
    } catch (e) {}
    const active = document.querySelector(".sale-mode-btn.active");
    if (active && active.getAttribute("data-pool")) {
      const pool = parseInt(active.getAttribute("data-pool"), 10);
      if (pool === 1) return 1;
    }
    return 0;
  }

  function getSnakeAmount() {
    const input = document.getElementById("snakeAmount");
    if (!input) {
      alert(t("Amount input not found.", "Miktar alanı bulunamadı."));
      return null;
    }
    const raw = (input.value || "").trim();
    const value = parseFloat(raw);
    if (!raw || isNaN(value) || value <= 0) {
      alert(
        t(
          "Please enter a valid SNAKE amount.",
          "Lütfen geçerli bir SNAKE miktarı girin."
        )
      );
      return null;
    }
    return raw; // string → parseUnits için
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

  function isMobileDevice() {
    if (typeof navigator === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|Opera Mini|IEMobile|BlackBerry/i.test(
      navigator.userAgent || ""
    );
  }

  function showMobileConnectHelper() {
    const modal = document.getElementById("mobile-connect-helper");
    if (!modal) {
      alert(
        t(
          "No Web3 wallet detected. Please open this page inside a Web3 wallet browser such as MetaMask, Trust Wallet, or Binance Web3 Wallet.",
          "Web3 cüzdanı bulunamadı. Lütfen bu sayfayı MetaMask, Trust Wallet, Binance Web3 gibi cüzdan uygulamalarının içindeki tarayıcıdan açın."
        )
      );
      return;
    }

    modal.style.display = "flex";

    const closeBtn = modal.querySelector(".mobile-connect-close");
    if (closeBtn && !closeBtn.dataset.bound) {
      closeBtn.dataset.bound = "1";
      closeBtn.addEventListener("click", function () {
        modal.style.display = "none";
      });
    }
  }

  // ---------- Provider seçimi ----------

  function detectInjectedProvider() {
    if (typeof window === "undefined") return null;

    // 1) Binance Web3 Wallet (mobil dApp browser)
    if (window.binancew3w && window.binancew3w.ethereum) {
      return window.binancew3w.ethereum;
    }

    // 2) Eski Binance Chain extension (desktop)
    if (window.BinanceChain) {
      return window.BinanceChain;
    }

    // 3) Standart EIP-1193 (MetaMask, Rabby, Trust, vs.)
    if (window.ethereum) {
      if (Array.isArray(window.ethereum.providers) && window.ethereum.providers.length > 0) {
        return window.ethereum.providers[0];
      }
      return window.ethereum;
    }

    return null;
  }

  function getInjectedProvider() {
    if (injectedProvider) return injectedProvider;
    injectedProvider = detectInjectedProvider();
    return injectedProvider;
  }

  // ---------- Web3 / Ethers ----------

  async function ensureProvider() {
    const injected = getInjectedProvider();
    if (!injected) {
      if (isMobileDevice()) {
        showMobileConnectHelper();
      } else {
        alert(
          t(
            "No Web3 wallet detected. Please install MetaMask, Trust Wallet browser, Binance Web3, etc.",
            "Web3 cüzdanı bulunamadı. Lütfen MetaMask, Trust Wallet, Binance Web3 vb. bir cüzdan kurun."
          )
        );
      }
      throw new Error("No ethereum provider");
    }

    if (typeof window.ethers === "undefined" || !window.ethers.providers) {
      alert(
        t(
          "Ethers.js not found. Make sure the ethers UMD script is included BEFORE snake-presale.js.",
          "Ethers.js kütüphanesi bulunamadı. Lütfen snake-presale.js dosyasından ÖNCE ethers UMD script'ini eklediğinizden emin olun."
        )
      );
      throw new Error("No ethers library");
    }

    if (!provider) {
      provider = new window.ethers.providers.Web3Provider(injected, "any");
    }
    return provider;
  }

  async function ensureCorrectNetwork() {
    const p = await ensureProvider();
    const network = await p.getNetwork();
    if (Number(network.chainId) === BSC_CHAIN_ID) {
      return;
    }

    const injected = getInjectedProvider();
    if (!injected || typeof injected.request !== "function") {
      alert(
        t(
          "Please switch your wallet to BNB Smart Chain (chainId 56) and try again.",
          "Lütfen cüzdan ağınızı BNB Smart Chain (chainId 56) olarak değiştirip tekrar deneyin."
        )
      );
      throw new Error("Cannot switch network from script");
    }

    try {
      await injected.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }] // 56
      });
    } catch (switchError) {
      console.error("Failed to switch to BSC:", switchError);
      alert(
        t(
          "Please switch your wallet to BNB Smart Chain (chainId 56) and try again.",
          "Lütfen cüzdan ağınızı BNB Smart Chain (chainId 56) olarak değiştirip tekrar deneyin."
        )
      );
      throw switchError;
    }
  }

  async function connectWallet() {
    if (isConnectingWallet) {
      alert(
        t(
          "There is already a pending wallet connection request. Please check your wallet extension and approve or reject it.",
          "Zaten bekleyen bir cüzdan bağlantı isteği var. Lütfen cüzdan eklentinizi açıp isteği onaylayın veya reddedin."
        )
      );
      return;
    }

    const p = await ensureProvider();
    const injected = getInjectedProvider();
    if (!injected || typeof injected.request !== "function") {
      alert(
        t(
          "No Web3 wallet detected. Please install MetaMask, Trust Wallet browser, Binance Web3, etc.",
          "Web3 cüzdanı bulunamadı. Lütfen MetaMask, Trust Wallet, Binance Web3 vb. bir cüzdan kurun."
        )
      );
      throw new Error("No request-capable provider");
    }

    await ensureCorrectNetwork();

    isConnectingWallet = true;
    try {
      const accounts = await injected.request({
        method: "eth_requestAccounts"
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No account selected");
      }

      signer = p.getSigner();
      userAddress = await signer.getAddress();

      if (connectBtnEl) {
        connectBtnEl.innerText = shortenAddress(userAddress);
        connectBtnEl.classList.add("connected");
      }

      console.log("Connected wallet:", userAddress);
      return userAddress;
    } catch (error) {
      if (
        error &&
        (error.code === -32002 ||
          (typeof error.message === "string" &&
            error.message.toLowerCase().includes("already pending")))
      ) {
        alert(
          t(
            "Your wallet already has a pending connection request for this site. Please open your wallet extension and complete or cancel it.",
            "Cüzdanınızda bu site için zaten bekleyen bir bağlantı isteği var. Lütfen cüzdan eklentinizi açıp isteği tamamlayın veya iptal edin."
          )
        );
        return;
      }

      logErrorContext("Connect failed", error);
    } finally {
      isConnectingWallet = false;
    }
  }

  function getPresaleContract() {
    if (!signer) {
      throw new Error("Wallet not connected");
    }
    return new window.ethers.Contract(PRESALE_ADDRESS, PRESALE_ABI, signer);
  }

  function getUsdtContract() {
    if (!signer) {
      throw new Error("Wallet not connected");
    }
    return new window.ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
  }

  // ---------- İş mantığı: BUY ----------

  async function handleBuyNow() {
    try {
      if (!signer || !userAddress) {
        await connectWallet();
        if (!signer || !userAddress) {
          return;
        }
      }

      const amountStr = getSnakeAmount();
      if (!amountStr) return;

      const method  = getCurrentPaymentMethod(); // "usdt" veya "bnb"
      const presale = getPresaleContract();
      const poolId  = getCurrentPoolId();

      const tokenAmount = window.ethers.utils.parseUnits(amountStr, 18); // 18 decimal

      if (buyBtnEl) {
        setButtonLoading(buyBtnEl, true);
      }

      if (method === "bnb") {
        const requiredBNB = await presale.getBNBAmountForTokens(
          poolId,
          tokenAmount
        );

        const bufferedBNB = requiredBNB.mul(101).div(100); // +%1 buffer

        console.log(
          "BNB required:",
          requiredBNB.toString(),
          "with buffer:",
          bufferedBNB.toString(),
          "poolId:",
          poolId
        );

        const tx = await presale.buyWithBNB(poolId, tokenAmount, {
          value: bufferedBNB
        });

        alert(
          t(
            "Transaction sent. Waiting for confirmation...",
            "İşlem gönderildi. Onay bekleniyor..."
          )
        );
        await tx.wait();
        alert(
          t(
            "Purchase successful!",
            "Satın alma işlemi başarılı!"
          )
        );
      } else {
        const requiredUSDT = await presale.getUSDTAmountForTokens(
          poolId,
          tokenAmount
        );
        console.log("USDT required:", requiredUSDT.toString(), "poolId:", poolId);

        const usdt = getUsdtContract();

        const allowance = await usdt.allowance(userAddress, PRESALE_ADDRESS);
        if (allowance.lt(requiredUSDT)) {
          const approveTx = await usdt.approve(PRESALE_ADDRESS, requiredUSDT);
          alert(
            t(
              "Approving USDT spend... Please confirm in your wallet.",
              "USDT harcama izni veriliyor... Lütfen cüzdanınızdan onaylayın."
            )
          );
          await approveTx.wait();
        }

        const tx = await presale.buyWithUSDT(
          poolId,
          tokenAmount,
          requiredUSDT
        );
        alert(
          t(
            "Transaction sent. Waiting for confirmation...",
            "İşlem gönderildi. Onay bekleniyor..."
          )
        );
        await tx.wait();
        alert(
          t(
            "Purchase successful!",
            "Satın alma işlemi başarılı!"
          )
        );
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
        if (!signer || !userAddress) {
          return;
        }
      }

      const presale = getPresaleContract();
      const poolId  = getCurrentPoolId();

      const claimable = await presale.getClaimableAmount(
        userAddress,
        poolId
      );
      console.log("Claimable:", claimable.toString(), "poolId:", poolId);

      if (claimable.lte(0)) {
        alert(
          t(
            "You have no claimable SNAKE yet. Claim opens ~2 days before TGE / listing and, for the vesting pool, unlocks monthly.",
            "Şu anda claim edilebilir SNAKE bakiyeniz yok. Claim paneli, TGE / listelemeden yaklaşık 2 gün önce açılır ve vesting havuzu için bakiye aylık olarak açılır."
          )
        );
        return;
      }

      if (claimBtnEl) {
        setButtonLoading(claimBtnEl, true, t("Claiming...", "Claim ediliyor..."));
      }

      const tx = await presale.claim(poolId);
      alert(
        t(
          "Claim transaction sent. Waiting for confirmation...",
          "Claim işlemi gönderildi. Onay bekleniyor..."
        )
      );
      await tx.wait();

      alert(
        t(
          "Claim successful! Your SNAKE has been sent to your wallet.",
          "Claim işlemi başarılı! SNAKE tokenlarınız cüzdanınıza gönderildi."
        )
      );
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
    const injected = getInjectedProvider();
    if (!injected || typeof injected.on !== "function") return;

    injected.on("accountsChanged", (accounts) => {
      console.log("accountsChanged:", accounts);
      if (!accounts || accounts.length === 0) {
        signer = null;
        userAddress = null;
        if (connectBtnEl) {
          connectBtnEl.innerText = t("Connect Wallet", "Cüzdanı Bağla");
          connectBtnEl.classList.remove("connected");
        }
      } else {
        userAddress = accounts[0];
        if (connectBtnEl) {
          connectBtnEl.innerText = shortenAddress(userAddress);
        }
      }
    });

    injected.on("chainChanged", (chainId) => {
      console.log("chainChanged:", chainId);
      window.location.reload();
    });
  }

  // ---------- Başlatma ----------

  function initSnakePresaleWeb3() {
    // Sadece snake-token sayfasında çalışsın
    if (!document.querySelector(".payment-methods")) {
      return;
    }

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
