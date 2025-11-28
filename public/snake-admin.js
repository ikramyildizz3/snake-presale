// Snake Presale Admin Panel (read-only)
// This file is intended to be used with snake-admin.html

(function () {
  const BSC_CHAIN_ID = 56;
  const PRESALE_ADDRESS = "0xbA073B1ec8fa5d7521E1592E03F08f1F272A7f5A";

  // TODO: Replace with your real admin wallet(s)
  const ADMIN_ADDRESSES = [
    "0xd2541854d142ffe0bd81bf21b646209f45b1d98d"
  ];

  const PRESALE_ADMIN_ABI = [
    "function userPurchased(address user, uint8 poolId) view returns (uint256)",
    "function userClaimed(address user, uint8 poolId) view returns (uint256)",
    "function totalSoldTokens() view returns (uint256)",
    "function totalClaimedTokens() view returns (uint256)"
  ];

  let provider = null;
  let signer = null;
  let adminWallet = null;

  function isAdmin(addr) {
    if (!addr) return false;
    return ADMIN_ADDRESSES.some((a) => a && a.toLowerCase() === addr.toLowerCase());
  }

  async function ensureProvider() {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("No Web3 wallet detected. Please open this page from MetaMask / Trust Wallet / Binance Web3 wallet.");
      throw new Error("No ethereum provider");
    }
    if (typeof window.ethers === "undefined") {
      alert("Ethers.js not found. Make sure the UMD build is loaded before snake-admin.js.");
      throw new Error("No ethers library");
    }
    if (!provider) {
      provider = new window.ethers.providers.Web3Provider(window.ethereum, "any");
    }
    return provider;
  }

  async function connectAdminWallet() {
    const connectBtn = document.getElementById("admin-connect-btn");
    const statusEl = document.getElementById("admin-status");
    const errEl = document.getElementById("admin-connect-error");
    const panelEl = document.getElementById("admin-panel");

    if (!connectBtn || !statusEl || !errEl || !panelEl) return;

    errEl.textContent = "";
    connectBtn.disabled = true;

    try {
      const p = await ensureProvider();
      const network = await p.getNetwork();
      if (Number(network.chainId) !== BSC_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x38" }]
          });
        } catch (switchErr) {
          errEl.textContent = "Please switch your wallet to BNB Smart Chain (chainId 56).";
          connectBtn.disabled = false;
          return;
        }
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });
      if (!accounts || !accounts.length) {
        throw new Error("No account selected");
      }

      const addr = window.ethers.utils.getAddress(accounts[0]);
      if (!isAdmin(addr)) {
        errEl.textContent = "Connected wallet is not in ADMIN_ADDRESSES. Edit snake-admin.js and add your admin wallet.";
        statusEl.innerHTML = '<span class="pill"><span class="pill-dot" style="background:#ef4444;"></span> Not authorized</span>';
        connectBtn.disabled = false;
        return;
      }

      signer = p.getSigner();
      adminWallet = addr;

      statusEl.innerHTML =
        '<span class="pill"><span class="pill-dot"></span> Admin: <span>' +
        addr +
        "</span></span>";

      panelEl.style.display = "block";
    } catch (err) {
      console.error("Admin connect failed:", err);
      errEl.textContent = err && err.message ? err.message : String(err);
    } finally {
      connectBtn.disabled = false;
    }
  }

  async function checkWallet() {
    const inputEl = document.getElementById("admin-wallet-input");
    const errEl = document.getElementById("admin-check-error");
    const valNormalPurchased = document.getElementById("val-normal-purchased");
    const valVestingPurchased = document.getElementById("val-vesting-purchased");
    const valNormalClaimed = document.getElementById("val-normal-claimed");
    const valVestingClaimed = document.getElementById("val-vesting-claimed");
    const valTotalSold = document.getElementById("val-total-sold");
    const valTotalClaimed = document.getElementById("val-total-claimed");

    if (!inputEl || !errEl) return;

    errEl.textContent = "";

    if (!adminWallet || !signer) {
      errEl.textContent = "Connect an admin wallet first.";
      return;
    }

    let target = (inputEl.value || "").trim();
    if (!target) {
      errEl.textContent = "Please enter a wallet address.";
      return;
    }

    try {
      target = window.ethers.utils.getAddress(target);
    } catch {
      errEl.textContent = "Invalid wallet address.";
      return;
    }

    try {
      const presale = new window.ethers.Contract(PRESALE_ADDRESS, PRESALE_ADMIN_ABI, signer);

      const [p0, p1, c0, c1, totalSold, totalClaimed] = await Promise.all([
        presale.userPurchased(target, 0),
        presale.userPurchased(target, 1),
        presale.userClaimed(target, 0),
        presale.userClaimed(target, 1),
        presale.totalSoldTokens(),
        presale.totalClaimedTokens()
      ]);

      const decimals = 18;
      const fmt = (v) => window.ethers.utils.formatUnits(v, decimals);

      if (valNormalPurchased) valNormalPurchased.textContent = fmt(p0);
      if (valVestingPurchased) valVestingPurchased.textContent = fmt(p1);
      if (valNormalClaimed) valNormalClaimed.textContent = fmt(c0);
      if (valVestingClaimed) valVestingClaimed.textContent = fmt(c1);
      if (valTotalSold) valTotalSold.textContent = fmt(totalSold);
      if (valTotalClaimed) valTotalClaimed.textContent = fmt(totalClaimed);
    } catch (err) {
      console.error("Admin check failed:", err);
      errEl.textContent = err && err.message ? err.message : String(err);
    }
  }

  function initAdminPanel() {
    const connectBtn = document.getElementById("admin-connect-btn");
    const checkBtn = document.getElementById("admin-check-btn");

    if (connectBtn) {
      connectBtn.addEventListener("click", connectAdminWallet);
    }
    if (checkBtn) {
      checkBtn.addEventListener("click", checkWallet);
    }

    const inputEl = document.getElementById("admin-wallet-input");
    if (inputEl) {
      inputEl.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          checkWallet();
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAdminPanel);
  } else {
    initAdminPanel();
  }
})();
