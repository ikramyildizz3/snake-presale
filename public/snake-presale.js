// Snake Presale Web3 integration
// REQUIREMENTS:
// 1) snake-token.html içinde, bu dosyadan ÖNCE şu scripti ekli:
//    <script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"></script>
// 2) Ana site JS'indan SONRA ekle:
//    <script src="snake-presale.js"></script>

(function () {
  // --------------------------
  // Sabitler
  // --------------------------
  const BSC_CHAIN_ID = 56; // BNB Smart Chain mainnet

  const SNAKE_TOKEN_ADDRESS = "0xc9F46963Ee83EFd45675867f622Dd3a0B7c494e7";
  const PRESALE_ADDRESS = "0xbA073B1ec8fa5d7521E1592E03F08f1F272A7f5A";
  const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

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

  // --------------------------
  // State
  // --------------------------
  let provider = null;
  let signer = null;
  let userAddress = null;

  let connectBtnEl = null;
  let buyBtnEl = null;
  let claimBtnEl = null;

  let isConnectingWallet = false;
  // 0 = Normal, 1 = Vesting (UI'deki sale-mode-btn ile senkron)
  let currentPoolId = 0;

  // Mesaj kutusu (sayfa içi info/error/success için)
  let messageBoxEl = null;

  // --------------------------
  // Yardımcı fonksiyonlar
  // --------------------------
  function logErrorContext(context, error) {
    console.error("[SnakePresale] " + context, error);
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

  // Dil helper
  function t(en, tr) {
    try {
      const lang =
        document.documentElement.getAttribute("lang") || "en";
      return lang.toLowerCase().startsWith("tr") ? tr : en;
    } catch {
      return en;
    }
  }

  function isMobileDevice() {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || navigator.vendor || "";
    return /android|iphone|ipad|ipod|opera mini|iemobile/i.test(ua);
  }

  // --------------------------
  // Sayfa içi mesaj kutusu
  // --------------------------
  function getMessageBoxElement() {
    if (!messageBoxEl && typeof document !== "undefined") {
      messageBoxEl = document.getElementById("web3-message");
    }
    return messageBoxEl;
  }

  function showWeb3Message(text, type = "info") {
    const box = getMessageBoxElement();
    if (box) {
      const safeText = text || "";
      box.textContent = safeText;
      box.style.display = safeText ? "block" : "none";
      box.classList.remove(
        "web3-message-info",
        "web3-message-error",
        "web3-message-success"
      );
      const className =
        type === "error"
          ? "web3-message-error"
          : type === "success"
            ? "web3-message-success"
            : "web3-message-info";
      box.classList.add(className);
    } else if (text) {
      // HTML'de kutu yoksa son çare alert
      alert(text);
    }
  }

  function clearWeb3Message() {
    const box = getMessageBoxElement();
    if (box) {
      box.textContent = "";
      box.style.display = "none";
      box.classList.remove(
        "web3-message-info",
        "web3-message-error",
        "web3-message-success"
      );
    }
  }

  // --------------------------
  // Provider seçimi + Binance tespiti
  // --------------------------
  function isBinanceWallet() {
    if (typeof window === "undefined") return false;

    // Yeni Binance Web3 (mobil dApp browser)
    if (window.binancew3w && window.binancew3w.ethereum) {
      return true;
    }

    // Binance Web3 Wallet için özel kontrol
    if (window.ethereum && window.ethereum.isBinance) {
      return true;
    }

    // User agent kontrolü
    const ua = navigator.userAgent || '';
    if (ua.includes('Binance') || ua.includes('BNB') || ua.includes('Web3Wallet')) {
      return true;
    }

    // Eski Binance Chain extension
    if (window.BinanceChain) {
      return true;
    }

    return false;
  }

  function getInjectedProvider() {
    if (typeof window === "undefined") return null;

    // 1) Binance Web3 Wallet (yeni API – mobil dApp browser)
    if (window.binancew3w && window.binancew3w.ethereum) {
      return window.binancew3w.ethereum;
    }

    // 2) Binance Web3 Wallet (eski API)
    if (window.ethereum && window.ethereum.isBinance) {
      return window.ethereum;
    }

    // 3) Eski Binance Chain extension (desktop)
    if (window.BinanceChain) {
      return window.BinanceChain;
    }

    // 4) Standart EIP-1193 (MetaMask, Trust vs.)
    if (window.ethereum) {
      return window.ethereum;
    }

    return null;
  }

  async function ensureProvider() {
    const injected = getInjectedProvider();

    if (!injected) {
      const msg = isMobileDevice()
        ? t(
          "No Web3 wallet detected. Please open this page inside MetaMask, Trust Wallet, Binance Web3, etc.",
          "Web3 cüzdanı bulunamadı. Lütfen bu sayfayı MetaMask, Trust Wallet, Binance Web3 vb. cüzdanın içindeki tarayıcıdan açın."
        )
        : t(
          "No Web3 wallet detected. Please install MetaMask, Trust Wallet, Binance Web3, etc.",
          "Web3 cüzdanı bulunamadı. Lütfen MetaMask, Trust Wallet, Binance Web3 vb. bir cüzdan kurun."
        );

      showWeb3Message(msg, "error");
      throw new Error("No injected provider");
    }

    if (typeof window.ethers === "undefined" || !window.ethers.providers) {
      showWeb3Message(
        t(
          "Ethers.js not found. Make sure the ethers UMD script is included BEFORE snake-presale.js.",
          "Ethers.js kütüphanesi bulunamadı. Lütfen snake-presale.js'den ÖNCE ethers script'ini eklediğinizden emin olun."
        ),
        "error"
      );
      throw new Error("Ethers.js missing");
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

    // Binance Web3 Wallet için network değiştirme
    if (isBinanceWallet()) {
      try {
        // Binance Web3 Wallet için BSC'ye geçiş deneyelim
        if (window.binancew3w && window.binancew3w.ethereum) {
          await window.binancew3w.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }]
          });
          return;
        }
        
        if (window.ethereum && window.ethereum.isBinance) {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }]
          });
          return;
        }
      } catch (err) {
        console.error('Binance network switch error:', err);
        // Hata olursa kullanıcıya manuel geçiş yapmasını söyle
        showWeb3Message(
          t(
            "Please switch your Binance wallet to BNB Smart Chain (chainId 56) and try again.",
            "Lütfen Binance cüzdan ağını BNB Smart Chain (chainId 56) olarak değiştirip tekrar deneyin."
          ),
          "error"
        );
        throw new Error("Wrong network on Binance wallet");
      }
    }

    if (!injected || typeof injected.request !== "function") {
      showWeb3Message(
        t(
          "Please switch your wallet to BNB Smart Chain (chainId 56) and try again.",
          "Lütfen cüzdan ağını BNB Smart Chain (chainId 56) olarak değiştirip tekrar deneyin."
        ),
        "error"
      );
      throw new Error("Cannot switch network programmatically");
    }

    try {
      await injected.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x38" }] // 56
      });
    } catch (err) {
      console.error("Failed to switch to BSC:", err);
      showWeb3Message(
        t(
          "Please switch your wallet to BNB Smart Chain (chainId 56) and try again.",
          "Lütfen cüzdan ağını BNB Smart Chain (chainId 56) olarak değiştirip tekrar deneyin."
        ),
        "error"
      );
      throw err;
    }
  }

  // --------------------------
  // Kontrat helper'ları
  // --------------------------
  function getPresaleContract(withSigner = true) {
    if (!provider) throw new Error("No provider");
    const base = withSigner && signer ? signer : provider;
    return new window.ethers.Contract(PRESALE_ADDRESS, PRESALE_ABI, base);
  }

  function getUsdtContract() {
    if (!signer) throw new Error("No signer");
    return new window.ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
  }

  // --------------------------
  // Wallet bağlantısı - GÜNCELLENDİ
  // --------------------------
  async function connectWallet() {
    clearWeb3Message();

    if (isConnectingWallet) {
      showWeb3Message(
        t(
          "There is already a pending wallet connection request. Please check your wallet.",
          "Zaten bekleyen bir cüzdan bağlantı isteği var. Lütfen cüzdanınızı kontrol edin."
        ),
        "info"
      );
      return;
    }

    await ensureProvider();
    await ensureCorrectNetwork();

    isConnectingWallet = true;
    try {
      const injected = getInjectedProvider();
      if (!injected || typeof injected.request !== "function") {
        throw new Error("No EIP-1193 provider");
      }

      // Binance Web3 Wallet için özel yaklaşım
      let accounts;
      if (window.binancew3w && window.binancew3w.ethereum) {
        accounts = await window.binancew3w.ethereum.request({
          method: "eth_requestAccounts"
        });
      } else {
        accounts = await injected.request({
          method: "eth_requestAccounts"
        });
      }

      if (!accounts || accounts.length === 0) {
        throw new Error("No account selected");
      }

      signer = provider.getSigner();
      userAddress = await signer.getAddress();

      if (connectBtnEl) {
        connectBtnEl.textContent = shortenAddress(userAddress);
        connectBtnEl.classList.add("connected");
      }

      showWeb3Message(
        t(
          "Wallet connected successfully.",
          "Cüzdan başarıyla bağlandı."
        ),
        "success"
      );

      console.log("[SnakePresale] Wallet connected:", userAddress);
      return userAddress;
    } catch (error) {
      const msg = String(error && error.message ? error.message : "").toLowerCase();

      if (
        error &&
        (error.code === 4001 || msg.includes("user rejected"))
      ) {
        showWeb3Message(
          t(
            "You rejected the wallet connection request.",
            "Cüzdan bağlantı isteğini reddettiniz."
          ),
          "error"
        );
        return;
      }

      if (
        error &&
        (error.code === -32002 || msg.includes("already pending"))
      ) {
        showWeb3Message(
          t(
            "Your wallet already has a pending connection request. Please open your wallet and complete/cancel it.",
            "Cüzdanınızda bu site için bekleyen bir bağlantı isteği var. Lütfen cüzdanı açıp isteği tamamlayın veya iptal edin."
          ),
          "info"
        );
        return;
      }

      logErrorContext("connectWallet failed", error);
      showWeb3Message(
        t(
          "Wallet connection failed. Please check your wallet and browser console.",
          "Cüzdan bağlantısı başarısız oldu. Lütfen cüzdanınızı ve tarayıcı konsolunu kontrol edin."
        ),
        "error"
      );
    } finally {
      isConnectingWallet = false;
    }
  }

  // --------------------------
  // Pool seçimi (Normal / Vesting)
  // --------------------------
  function initPoolSwitcher() {
    const poolButtons = document.querySelectorAll(".sale-mode-btn");
    if (!poolButtons || !poolButtons.length) return;

    poolButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        poolButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const poolId = Number(btn.getAttribute("data-pool") || "0");
        currentPoolId = poolId;

        // Ana JS'in kullandığı global değişkenle de senkron tutalım
        window.currentSalePool = poolId;
        console.log("[SnakePresale] Pool changed:", poolId);
      });
    });

    // Varsayılan: 0 (normal)
    currentPoolId = Number(
      (window.currentSalePool !== undefined ? window.currentSalePool : 0) || 0
    );
  }

  // --------------------------
  // Satın alma
  // --------------------------
  async function handleBuy() {
    try {
      clearWeb3Message();

      // Cüzdan bağlanmamışsa önce bağla
      await connectWallet();

      if (!signer || !userAddress) {
        showWeb3Message(
          t(
            "Wallet is not connected. Please connect your wallet first.",
            "Cüzdan bağlı değil. Lütfen önce cüzdanınızı bağlayın."
          ),
          "error"
        );
        return;
      }

      const amountInput = document.getElementById("snakeAmount");
      if (!amountInput) {
        showWeb3Message(
          t(
            "Amount input not found on page.",
            "Miktar input alanı sayfada bulunamadı."
          ),
          "error"
        );
        return;
      }

      const tokenAmountNumber = parseNumberFromInput(amountInput);
      if (!tokenAmountNumber || tokenAmountNumber <= 0) {
        showWeb3Message(
          t(
            "Please enter a valid SNAKE amount.",
            "Lütfen geçerli bir SNAKE miktarı girin."
          ),
          "error"
        );
        return;
      }

      const activePaymentBtn = document.querySelector(
        ".payment-btn.active"
      );
      if (!activePaymentBtn) {
        showWeb3Message(
          t(
            "Please select a payment method (USDT or BNB).",
            "Lütfen bir ödeme yöntemi seçin (USDT veya BNB)."
          ),
          "error"
        );
        return;
      }

      const method = activePaymentBtn.getAttribute("data-method") || "usdt";
      const tokenAmountWei = toWei(tokenAmountNumber);
      const presale = getPresaleContract(true);

      if (
        !window.confirm(
          t(
            "Are you sure you want to buy this amount of SNAKE tokens?",
            "Bu miktarda SNAKE token almak istediğinizden emin misiniz?"
          )
        )
      ) {
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
        console.log("[SnakePresale] buyWithBNB tx:", tx.hash);

        showWeb3Message(
          t(
            "Transaction sent. Please wait for confirmation in your wallet.",
            "İşlem gönderildi. Lütfen cüzdanınızdan onaylanmasını bekleyin."
          ),
          "info"
        );
        await tx.wait();

        showWeb3Message(
          t("Purchase successful!", "Satın alma işlemi başarılı!"),
          "success"
        );
      } else {
        const usdt = getUsdtContract();
        const requiredUSDT = await presale.getUSDTAmountForTokens(
          currentPoolId,
          tokenAmountWei
        );

        const allowance = await usdt.allowance(
          userAddress,
          PRESALE_ADDRESS
        );

        if (allowance.lt(requiredUSDT)) {
          const approveTx = await usdt.approve(
            PRESALE_ADDRESS,
            requiredUSDT
          );
          console.log("[SnakePresale] USDT approve tx:", approveTx.hash);
          showWeb3Message(
            t(
              "Approval transaction sent. Please wait for confirmation.",
              "Onay işlemi gönderildi. Lütfen onaylanmasını bekleyin."
            ),
            "info"
          );
          await approveTx.wait();
        }

        const tx = await presale.buyWithUSDT(
          currentPoolId,
          tokenAmountWei,
          requiredUSDT
        );
        console.log("[SnakePresale] buyWithUSDT tx:", tx.hash);

        showWeb3Message(
          t(
            "Transaction sent. Please wait for confirmation in your wallet.",
            "İşlem gönderildi. Lütfen cüzdanınızdan onaylanmasını bekleyin."
          ),
          "info"
        );
        await tx.wait();

        showWeb3Message(
          t("Purchase successful!", "Satın alma işlemi başarılı!"),
          "success"
        );
      }
    } catch (error) {
      logErrorContext("handleBuy failed", error);
      showWeb3Message(
        t(
          "Transaction failed or was rejected. Please check your wallet and browser console.",
          "İşlem başarısız oldu veya reddedildi. Lütfen cüzdanınızı ve tarayıcı konsolunu kontrol edin."
        ),
        "error"
      );
    }
  }

  // --------------------------
  // Claim
  // --------------------------
  async function handleClaim() {
    try {
      clearWeb3Message();

      await connectWallet();

      if (!signer || !userAddress) {
        showWeb3Message(
          t(
            "Wallet is not connected. Please connect your wallet first.",
            "Cüzdan bağlı değil. Lütfen önce cüzdanınızı bağlayın."
          ),
          "error"
        );
        return;
      }

      const presale = getPresaleContract(true);

      // Seçili pool için claimable
      const claimable = await presale.getClaimableAmount(
        userAddress,
        currentPoolId
      );

      if (claimable.lte(0)) {
        // Önce bu havuzda alım var mı bak
        const purchased = await presale.userPurchased(
          userAddress,
          currentPoolId
        );

        if (purchased.lte(0)) {
          showWeb3Message(
            t(
              "You have not purchased any SNAKE in this presale pool.",
              "Bu ön satış havuzunda hiç SNAKE satın almamışsınız."
            ),
            "info"
          );
          return;
        }

        // Alım var ama claim yok → TGE / claim penceresine bakalım
        const tgeTs = await presale.tgeTimestamp();
        const tgeSeconds = Number(tgeTs || 0);

        if (!tgeSeconds) {
          showWeb3Message(
            t(
              "TGE time has not been set yet. Claim is not available.",
              "TGE tarihi henüz ayarlanmamış. Claim işlemi şu anda kullanılamıyor."
            ),
            "info"
          );
          return;
        }

        const now = Math.floor(Date.now() / 1000);
        const twoDays = 2 * 24 * 60 * 60;
        const claimStart = tgeSeconds - twoDays;

        const claimStartDate = new Date(claimStart * 1000);
        const tgeDate = new Date(tgeSeconds * 1000);

        if (now < claimStart) {
          // TGE'den 2 gün önce açılacak uyarısı
          const msgEn =
            "Claim will open about 2 days before TGE.\n" +
            "Estimated claim start: " +
            claimStartDate.toLocaleString() +
            "\nTGE: " +
            tgeDate.toLocaleString();

          const msgTr =
            "Claim işlemi TGE tarihinden yaklaşık 2 gün önce açılacak.\n" +
            "Tahmini açılış: " +
            claimStartDate.toLocaleString("tr-TR") +
            "\nTGE: " +
            tgeDate.toLocaleString("tr-TR");

          showWeb3Message(t(msgEn, msgTr), "info");
        } else if (now < tgeSeconds) {
          showWeb3Message(
            t(
              "Claim is opening very soon (within 2 days of TGE). Please try again closer to TGE.",
              "Claim işlemi çok yakında açılacak (TGE'ye 2 günden az kaldı). Lütfen TGE'ye daha yakın bir zamanda tekrar deneyin."
            ),
            "info"
          );
        } else {
          showWeb3Message(
            t(
              "You currently have no claimable tokens in this pool.",
              "Şu anda bu havuzda çekebileceğiniz hakediş bulunmuyor."
            ),
            "info"
          );
        }

        return;
      }

      const claimableNum = fromWeiToNumber(claimable);

      if (
        !window.confirm(
          t(
            `You are about to claim approximately ${claimableNum.toFixed(
              2
            )} SNAKE.\nDo you want to continue?`,
            `Yaklaşık ${claimableNum.toFixed(
              2
            )} SNAKE claim etmek üzeresiniz.\nDevam etmek istiyor musunuz?`
          )
        )
      ) {
        return;
      }

      const tx = await presale.claim(currentPoolId);
      console.log("[SnakePresale] claim tx:", tx.hash);

      showWeb3Message(
        t(
          "Claim transaction sent. Please wait for confirmation.",
          "Claim işlemi gönderildi. Lütfen onaylanmasını bekleyin."
        ),
        "info"
      );
      await tx.wait();

      showWeb3Message(
        t("Claim successful!", "Claim işlemi başarılı!"),
        "success"
      );
    } catch (error) {
      logErrorContext("handleClaim failed", error);
      showWeb3Message(
        t(
          "Claim failed or was rejected. Please check your wallet and browser console.",
          "Claim işlemi başarısız oldu veya reddedildi. Lütfen cüzdanınızı ve tarayıcı konsolunu kontrol edin."
        ),
        "error"
      );
    }
  }

  // --------------------------
  // Provider event'leri
  // --------------------------
  function setupEthereumEvents() {
    const injected = getInjectedProvider();
    if (!injected || typeof injected.on !== "function") return;

    injected.on("accountsChanged", (accounts) => {
      console.log("[SnakePresale] accountsChanged:", accounts);
      if (!accounts || accounts.length === 0) {
        signer = null;
        userAddress = null;
        if (connectBtnEl) {
          connectBtnEl.textContent = t(
            "Connect Wallet",
            "Cüzdanı Bağla"
          );
          connectBtnEl.classList.remove("connected");
        }
        showWeb3Message(
          t(
            "Wallet disconnected. Please reconnect if you want to join the presale.",
            "Cüzdan bağlantısı kesildi. Ön satışa katılmak için tekrar bağlayın."
          ),
          "info"
        );
      } else {
        userAddress = accounts[0];
        if (connectBtnEl) {
          connectBtnEl.textContent = shortenAddress(userAddress);
          connectBtnEl.classList.add("connected");
        }
        showWeb3Message(
          t(
            "Wallet account changed.",
            "Cüzdan hesabı değiştirildi."
          ),
          "info"
        );
      }
    });

    injected.on("chainChanged", (chainId) => {
      console.log("[SnakePresale] chainChanged:", chainId);
      // Basit: ağ değişince sayfayı yenile
      window.location.reload();
    });
  }

  // --------------------------
  // Init
  // --------------------------
  function initSnakePresaleWeb3() {
    // Sadece presale formu olan sayfada çalışsın
    if (!document.getElementById("snakeAmount")) {
      return;
    }

    // Butonları HTML yapına göre seçiyoruz
    connectBtnEl = document.querySelector(".connect-wallet");
    buyBtnEl = document.querySelector(".action-buttons .btn-primary");
    claimBtnEl = document.querySelector(".action-buttons .btn-secondary");

    if (connectBtnEl) {
      connectBtnEl.addEventListener("click", function () {
        connectWallet().catch((err) => {
          logErrorContext("Connect button click", err);
        });
      });
    }

    if (buyBtnEl) {
      buyBtnEl.addEventListener("click", function () {
        handleBuy().catch((err) => {
          logErrorContext("Buy button click", err);
        });
      });
    }

    if (claimBtnEl) {
      claimBtnEl.addEventListener("click", function () {
        handleClaim().catch((err) => {
          logErrorContext("Claim button click", err);
        });
      });
    }

    // Pool switcher (Normal / Vesting)
    initPoolSwitcher();
    setupEthereumEvents();

    console.log("[SnakePresale] Web3 integration initialized.");
  }

  window.addEventListener("DOMContentLoaded", function () {
    try {
      initSnakePresaleWeb3();
    } catch (err) {
      logErrorContext("initSnakePresaleWeb3 failed", err);
    }
  });
})();