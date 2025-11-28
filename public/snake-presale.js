// Snake Presale Web3 integration
// REQUIREMENTS:
// 1) snake-token.html içinde, bu dosyadan ÖNCE şu scripti ekle:
//    <script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"></script>
// 2) Mevcut ana JS dosyanızdan (site mantığı) SONRA şu scripti ekleyin:
//    <script src="snake-presale.js"></script>

(function () {
  // --------------------------
  // Sabitler
  // --------------------------
  const BSC_CHAIN_ID = 56; // BNB Smart Chain mainnet

  const SNAKE_TOKEN_ADDRESS = "0xc9F46963Ee83EFd45675867f622Dd3a0B7c494e7";
  const PRESALE_ADDRESS = "0xbA073B1ec8fa5d7521E1592E03F08f1F272A7f5A";
  const USDT_ADDRESS   = "0x55d398326f99059fF775485246999027B3197955";

  const PRESALE_ABI = [
    "function POOL_NORMAL() view returns (uint8)",
    "function POOL_VESTING() view returns (uint8)",

    "function getBNBAmountForTokens(uint8 poolId, uint256 tokenAmount) view returns (uint256)",
    "function getUSDTAmountForTokens(uint8 poolId, uint256 tokenAmount) view returns (uint256)",

    "function buyWithBNB(uint8 poolId, uint256 tokenAmount) payable",
    "function buyWithUSDT(uint8 poolId, uint256 tokenAmount, uint256 maxUSDT)",

    "function getClaimableAmount(address user, uint8 poolId) view returns (uint256)",
    "function claim(uint8 poolId)",

    "function userPurchased(address user, uint8 poolId) view returns (uint256)",
    "function userClaimed(address user, uint8 poolId) view returns (uint256)",

    "function totalSoldTokens() view returns (uint256)",
    "function totalClaimedTokens() view returns (uint256)",
    "function tgeTimestamp() view returns (uint256)",
    "function vesting() view returns (uint256 tgePercentBP, uint256 monthlyPercentBP, uint8 months)"
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

  let isConnectingWallet = false;
  let currentPoolId = 0; // 0 = normal, 1 = vesting

  // --------------------------
  // Yardımcılar
  // --------------------------

  function logErrorContext(context, error) {
    console.error(`[SnakePresale] ${context}`, error);
  }

  function shortenAddress(addr) {
    if (!addr || addr.length < 10) return addr;
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  }

  function parseNumberFromInput(el) {
    if (!el) return 0;
    const raw = (el.value || "").replace(",", ".").trim();
    if (!raw) return 0;
    const n = Number(raw);
    if (!isFinite(n) || n <= 0) return 0;
    return n;
  }

  function toWei(amount) {
    return window.ethers.utils.parseUnits(String(amount), 18);
  }

  function fromWeiToNumber(value) {
    return Number(window.ethers.utils.formatUnits(value, 18));
  }

  function t(en, tr) {
    try {
      const htmlLang = document.documentElement.getAttribute("lang") || "en";
      return htmlLang.toLowerCase().startsWith("tr") ? tr : en;
    } catch {
      return en;
    }
  }

  function isMobileDevice() {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || navigator.vendor || "";
    return /android|iphone|ipad|ipod|opera mini|iemobile/i.test(ua);
  }

  function showMobileConnectHelper() {
    const modal = document.getElementById("mobile-connect-helper");
    if (!modal) {
      alert(
        t(
          "No Web3 wallet detected. Please install MetaMask, Trust Wallet, Binance Web3 etc. and open this page inside the wallet browser.",
          "Web3 cüzdanı bulunamadı. Lütfen MetaMask, Trust Wallet, Binance Web3 vb. bir cüzdan kurup bu sayfayı cüzdanın içindeki tarayıcıdan açın."
        )
      );
      return;
    }

    modal.style.display = "flex";
    const closeBtn = modal.querySelector(".mobile-connect-close");
    if (closeBtn && !closeBtn.dataset.bound) {
      closeBtn.dataset.bound = "1";
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });
    }
  }

  // Provider seçimi (BinanceChain + ethereum destekli)
  function getInjectedProvider() {
    if (typeof window === "undefined") return null;

    // 1) Sadece BinanceChain varsa onu kullan (Binance Web3 mobil senaryosu)
    if (window.BinanceChain && !window.ethereum) {
      return window.BinanceChain;
    }

    // 2) Standart EIP-1193 (MetaMask, Trust vs.)
    if (window.ethereum) {
      return window.ethereum;
    }

    // 3) Yine de BinanceChain varsa onu dene
    if (window.BinanceChain) {
      return window.BinanceChain;
    }

    return null;
  }

  // --------------------------
  // Provider & ağ kontrolü
  // --------------------------

  async function ensureProvider() {
    if (typeof window === "undefined") {
      throw new Error("Window is not defined");
    }

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

    try {
      await p.send("wallet_switchEthereumChain", [{ chainId: "0x38" }]); // 56
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

  // --------------------------
  // Kontrat instance helper
  // --------------------------

  function getPresaleContract() {
    if (!signer) throw new Error("No signer");
    return new window.ethers.Contract(PRESALE_ADDRESS, PRESALE_ABI, signer);
  }

  function getUsdtContract() {
    if (!signer) throw new Error("No signer");
    return new window.ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
  }

  // --------------------------
  // Wallet bağlama
  // --------------------------

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

    isConnectingWallet = true;
    try {
      const p = await ensureProvider();
      await ensureCorrectNetwork();

      // ÖNEMLİ: Doğrudan injected.request kullanmıyoruz.
      const accounts = await p.send("eth_requestAccounts", []);

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
      const msg = String(error && error.message ? error.message : "").toLowerCase();
      const code = error && error.code;

      if (
        code === 4001 ||
        msg.includes("user rejected") ||
        msg.includes("user denied") ||
        msg.includes("rejected the request")
      ) {
        alert(
          t(
            "You rejected the wallet connection request.",
            "Cüzdan bağlantı isteğini reddettiniz."
          )
        );
        return;
      }

      if (
        code === -32002 ||
        msg.includes("already pending")
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
      alert(
        t(
          "Wallet connection failed. Please check your wallet app.",
          "Cüzdan bağlantısı başarısız oldu. Lütfen cüzdan uygulamanızı kontrol edin."
        )
      );
    } finally {
      isConnectingWallet = false;
    }
  }

  // --------------------------
  // UI'den pool seçimi
  // --------------------------

  function initPoolSwitcher() {
    const poolButtons = document.querySelectorAll(".sale-mode-btn");
    if (!poolButtons || poolButtons.length === 0) return;

    poolButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        poolButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const poolId = Number(btn.dataset.pool || "0");
        currentPoolId = poolId;
        updatePayButtonLabel();
        updateClaimInfo();
      });
    });
  }

  function updatePayButtonLabel() {
    if (!buyBtnEl) return;

    const activePoolBtn = document.querySelector(".sale-mode-btn.active");
    if (!activePoolBtn) return;

    const poolId = Number(activePoolBtn.dataset.pool || "0");
    if (poolId === 1) {
      buyBtnEl.innerText = t("Buy Vesting Presale", "Vestingli Ön Satış Al");
    } else {
      buyBtnEl.innerText = t("Buy Normal Presale", "Normal Ön Satış Al");
    }
  }

  // --------------------------
  // Fiyat hesaplama (UI tarafı)
  // --------------------------

  function getActivePaymentMethodButton() {
    // Hem eski .payment-btn hem yeni .payment-method-btn için destek
    let btn = document.querySelector(".payment-method-btn.active");
    if (!btn) {
      btn = document.querySelector(".payment-btn.active");
    }
    return btn;
  }

  async function updateCostPreview() {
    try {
      const amountInput = document.querySelector("#snakeAmount");
      const methodBtnActive = getActivePaymentMethodButton();
      const costPreviewEl = document.querySelector("#cost-preview");
      if (!amountInput || !methodBtnActive || !costPreviewEl) return;

      const tokenAmountNumber = parseNumberFromInput(amountInput);
      if (!tokenAmountNumber || tokenAmountNumber <= 0) {
        costPreviewEl.innerText = "";
        return;
      }

      const p = await ensureProvider();
      const presaleRead = new window.ethers.Contract(
        PRESALE_ADDRESS,
        PRESALE_ABI,
        p
      );

      const tokenAmountWei = toWei(tokenAmountNumber);

      let text;
      const method = methodBtnActive.dataset.method;
      if (method === "bnb") {
        const bnbAmount = await presaleRead.getBNBAmountForTokens(
          currentPoolId,
          tokenAmountWei
        );
        const bnbFloat = Number(
          window.ethers.utils.formatUnits(bnbAmount, 18)
        ).toFixed(5);
        text = t(
          `You will pay approximately ${bnbFloat} BNB.`,
          `Yaklaşık ${bnbFloat} BNB ödeyeceksiniz.`
        );
      } else {
        const usdtAmount = await presaleRead.getUSDTAmountForTokens(
          currentPoolId,
          tokenAmountWei
        );
        const usdtFloat = Number(
          window.ethers.utils.formatUnits(usdtAmount, 18)
        ).toFixed(2);
        text = t(
          `You will pay approximately ${usdtFloat} USDT.`,
          `Yaklaşık ${usdtFloat} USDT ödeyeceksiniz.`
        );
      }

      costPreviewEl.innerText = text;
    } catch (err) {
      logErrorContext("updateCostPreview failed", err);
    }
  }

  // --------------------------
  // Satın alma işlemleri
  // --------------------------

  async function handleBuyClick() {
    try {
      const p = await ensureProvider();
      await ensureCorrectNetwork();
      await connectWallet();

      if (!signer || !userAddress) {
        throw new Error("No wallet connected");
      }

      const presale = getPresaleContract();

      const amountInput = document.querySelector("#snakeAmount");
      const methodBtnActive = getActivePaymentMethodButton();
      if (!amountInput || !methodBtnActive) {
        alert(
          t(
            "Please enter amount and select payment method.",
            "Lütfen miktar girin ve ödeme yöntemini seçin."
          )
        );
        return;
      }

      const tokenAmountNumber = parseNumberFromInput(amountInput);
      if (!tokenAmountNumber || tokenAmountNumber <= 0) {
        alert(
          t(
            "Please enter a valid token amount.",
            "Lütfen geçerli bir token miktarı girin."
          )
        );
        return;
      }

      const tokenAmountWei = toWei(tokenAmountNumber);
      const method = methodBtnActive.dataset.method;

      if (!window.confirm(
        t(
          "Are you sure you want to buy this amount of SNAKE tokens?",
          "Bu miktarda SNAKE token almak istediğinizden emin misiniz?"
        )
      )) {
        return;
      }

      if (method === "bnb") {
        const requiredBNB = await presale.getBNBAmountForTokens(
          currentPoolId,
          tokenAmountWei
        );
        const tx = await presale.buyWithBNB(currentPoolId, tokenAmountWei, {
          value: requiredBNB
        });
        console.log("buyWithBNB tx:", tx.hash);
        alert(
          t(
            "Transaction sent. Please wait for confirmation in your wallet.",
            "İşlem gönderildi. Lütfen cüzdanınızdan onaylanmasını bekleyin."
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
        const usdt = getUsdtContract();
        const requiredUSDT = await presale.getUSDTAmountForTokens(
          currentPoolId,
          tokenAmountWei
        );

        const allowance = await usdt.allowance(userAddress, PRESALE_ADDRESS);
        if (allowance.lt(requiredUSDT)) {
          const approveTx = await usdt.approve(PRESALE_ADDRESS, requiredUSDT);
          console.log("USDT approve tx:", approveTx.hash);
          alert(
            t(
              "Approval transaction sent. Please wait for confirmation.",
              "Onay işlemi gönderildi. Lütfen onaylanmasını bekleyin."
            )
          );
          await approveTx.wait();
        }

        const tx = await presale.buyWithUSDT(
          currentPoolId,
          tokenAmountWei,
          requiredUSDT
        );
        console.log("buyWithUSDT tx:", tx.hash);
        alert(
          t(
            "Transaction sent. Please wait for confirmation in your wallet.",
            "İşlem gönderildi. Lütfen cüzdanınızdan onaylanmasını bekleyin."
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

      updateCostPreview();
      updateClaimInfo();
    } catch (error) {
      logErrorContext("handleBuyClick failed", error);
      alert(
        t(
          "Transaction failed or was rejected. Please check the console for details.",
          "İşlem başarısız oldu veya reddedildi. Detaylar için konsolu kontrol edin."
        )
      );
    }
  }

  // --------------------------
  // Claim işlemleri
  // --------------------------

  async function updateClaimInfo() {
    try {
      const claimInfoEl = document.querySelector("#claim-info");
      if (!claimInfoEl) return;

      const p = await ensureProvider();

      if (!userAddress) {
        claimInfoEl.innerText = t(
          "Connect your wallet to see claimable amount.",
          "Hak ediş miktarınızı görmek için cüzdanınızı bağlayın."
        );
        return;
      }

      const presaleRead = new window.ethers.Contract(
        PRESALE_ADDRESS,
        PRESALE_ABI,
        p
      );

      const totalPurchasedPool0 = await presaleRead.userPurchased(
        userAddress,
        0
      );
      const totalPurchasedPool1 = await presaleRead.userPurchased(
        userAddress,
        1
      );

      const claimablePool0 = await presaleRead.getClaimableAmount(
        userAddress,
        0
      );
      const claimablePool1 = await presaleRead.getClaimableAmount(
        userAddress,
        1
      );

      const totalClaimable = claimablePool0.add(claimablePool1);
      const totalPurchasedAll = totalPurchasedPool0.add(totalPurchasedPool1);

      const purchasedNum = fromWeiToNumber(totalPurchasedAll);
      const claimableNum = fromWeiToNumber(totalClaimable);

      if (purchasedNum === 0) {
        claimInfoEl.innerText = t(
          "You have not purchased any SNAKE in this presale.",
          "Bu ön satışta hiç SNAKE satın almamışsınız."
        );
        return;
      }

      claimInfoEl.innerText = t(
        `Total purchased: ${purchasedNum.toFixed(2)} SNAKE | Claimable now: ${claimableNum.toFixed(2)} SNAKE`,
        `Toplam satın aldığınız: ${purchasedNum.toFixed(2)} SNAKE | Şu anda çekilebilir: ${claimableNum.toFixed(2)} SNAKE`
      );
    } catch (err) {
      logErrorContext("updateClaimInfo failed", err);
    }
  }

  async function handleClaimClick() {
    try {
      const p = await ensureProvider();
      await ensureCorrectNetwork();
      await connectWallet();

      if (!signer || !userAddress) {
        throw new Error("No wallet connected");
      }

      const presale = getPresaleContract();

      const claimable = await presale.getClaimableAmount(
        userAddress,
        currentPoolId
      );
      if (claimable.lte(0)) {
        alert(
          t(
            "You have nothing to claim in this pool yet.",
            "Bu havuzda şu anda çekebileceğiniz bir hakediş yok."
          )
        );
        return;
      }

      if (!window.confirm(
        t(
          "Do you want to claim your unlocked SNAKE tokens now?",
          "Şu anda açılmış SNAKE token hak edişinizi çekmek istiyor musunuz?"
        )
      )) {
        return;
      }

      const tx = await presale.claim(currentPoolId);
      console.log("claim tx:", tx.hash);
      alert(
        t(
          "Claim transaction sent. Please wait for confirmation.",
          "Claim işlemi gönderildi. Lütfen onaylanmasını bekleyin."
        )
      );
      await tx.wait();

      alert(
        t(
          "Claim successful!",
          "Claim işlemi başarılı!"
        )
      );

      updateClaimInfo();
    } catch (error) {
      logErrorContext("handleClaimClick failed", error);
      alert(
        t(
          "Claim failed or was rejected. Please check the console for details.",
          "Claim işlemi başarısız oldu veya reddedildi. Detaylar için konsolu kontrol edin."
        )
      );
    }
  }

  // --------------------------
  // Provider eventleri
  // --------------------------

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
          connectBtnEl.classList.add("connected");
        }
        updateClaimInfo();
      }
    });

    injected.on("chainChanged", (chainId) => {
      console.log("chainChanged:", chainId);
      window.location.reload();
    });
  }

  // --------------------------
  // Başlatma
  // --------------------------

  function initSnakePresaleWeb3() {
    // Sadece presale sayfasında çalışsın
    if (!document.querySelector(".payment-methods") &&
        !document.querySelector(".payment-btn")) {
      return;
    }

    // Connect: önce id, sonra .connect-wallet
    connectBtnEl =
      document.querySelector("#connect-wallet-btn") ||
      document.querySelector(".connect-wallet");

    // Buy: id yoksa ilk .btn-primary
    buyBtnEl =
      document.querySelector("#buy-tokens-btn") ||
      document.querySelector(".btn-primary");

    // Claim: id / data attribute / class fallback
    claimBtnEl =
      document.querySelector("#claim-tokens-btn") ||
      document.querySelector("[data-claim-btn]") ||
      document.querySelector(".btn-claim");

    if (connectBtnEl) {
      connectBtnEl.addEventListener("click", () => {
        connectWallet().catch((err) => {
          logErrorContext("Connect button click error", err);
        });
      });
    }

    if (buyBtnEl) {
      buyBtnEl.addEventListener("click", () => {
        handleBuyClick().catch((err) => {
          logErrorContext("Buy button click error", err);
        });
      });
    }

    if (claimBtnEl) {
      claimBtnEl.addEventListener("click", () => {
        handleClaimClick().catch((err) => {
          logErrorContext("Claim button click error", err);
        });
      });
    }

    const tokenAmountInput = document.querySelector("#snakeAmount");
    if (tokenAmountInput) {
      tokenAmountInput.addEventListener("input", () => {
        updateCostPreview();
      });
    }

    const payMethodButtons = document.querySelectorAll(".payment-method-btn, .payment-btn");
    if (payMethodButtons && payMethodButtons.length > 0) {
      payMethodButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          payMethodButtons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          updateCostPreview();
        });
      });
    }

    initPoolSwitcher();
    updatePayButtonLabel();
    updateCostPreview();
    updateClaimInfo();
    setupEthereumEvents();

    console.log("[SnakePresale] Web3 integration initialized.");
  }

  window.addEventListener("DOMContentLoaded", () => {
    try {
      initSnakePresaleWeb3();
    } catch (err) {
      logErrorContext("initSnakePresaleWeb3 failed", err);
    }
  });
})();
