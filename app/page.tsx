
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Toaster, toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  Wallet,
  ArrowDown,
  Twitter,
  Send,
  CheckCircle2,
  Clock,
} from "lucide-react";

type PayMethod = "USDT" | "BNB";
type Language = "en" | "tr";

interface DetailItemProps {
  label: string;
  value: React.ReactNode;
}

interface SummaryRowProps {
  label: string;
  value: React.ReactNode;
}

interface RoadmapCardProps {
  phase: string;
  completed: boolean;
  items: string[];
}

interface TokenomicsSlice {
  name: string;
  nameTr: string;
  value: number;
  [key: string]: string | number;
}

const TOKEN = {
  name: "SNAKE Token",
  symbol: "SNAKE",
  totalSupply: 400_000_000,
  priceUSDT: 0.02,
  bnbUsdtRate: 300, // initial fallback
  contractAddress: "0xc9F46963Ee83EFd45675867f622Dd3a0B7c494e7",
};

const LOCKED_TOKENS = 100_000_000;

const PRESALE_SOFT_CAP = 200_000; // USDT (example, adjust later)
const PRESALE_HARD_CAP = 500_000; // USDT (example, adjust later)
const PRESALE_RAISED = 0; // static for now, can be wired to backend later

const TOKENOMICS: TokenomicsSlice[] = [
  { name: "Presale", nameTr: "Ön Satış", value: 25 },
  { name: "Liquidity", nameTr: "Likidite", value: 20 },
  { name: "Staking & Rewards", nameTr: "Staking & Ödüller", value: 15 },
  { name: "Team & Advisors", nameTr: "Ekip & Danışmanlar", value: 10 },
  { name: "Marketing", nameTr: "Pazarlama", value: 15 },
  { name: "Reserve", nameTr: "Rezerv", value: 10 },
  { name: "Airdrop & Community", nameTr: "Airdrop & Topluluk", value: 5 },
];

const CHART_COLORS: string[] = [
  "#22c55e",
  "#06b6d4",
  "#8b5cf6",
  "#f97316",
  "#eab308",
  "#ef4444",
  "#3b82f6",
];

const ROADMAP: RoadmapCardProps[] = [
  {
    phase: "Phase 1 — Launch",
    completed: true,
    items: [
      "Smart contract deployment",
      "Website & branding",
      "Community building start",
    ],
  },
  {
    phase: "Phase 2 — Presale",
    completed: true,
    items: ["Presale opening", "Initial marketing push", "KOL partnerships"],
  },
  {
    phase: "Phase 3 — Listing",
    completed: false,
    items: [
      "DEX listing (PancakeSwap)",
      "Liquidity pool setup",
      "Post-launch campaigns",
    ],
  },
  {
    phase: "Phase 4 — Staking",
    completed: false,
    items: ["Staking dashboard", "Reward pools", "Long-term incentives"],
  },
  {
    phase: "Phase 5 — Expansion",
    completed: false,
    items: ["CEX outreach", "Ecosystem tools", "Global community events"],
  },
  {
    phase: "Phase 6 — Scale",
    completed: false,
    items: ["New utilities", "Partnership integrations", "Sustainable growth"],
  },
];

const ROADMAP_TRANSLATIONS: Record<
  string,
  { phaseTr: string; itemsTr: string[] }
> = {
  "Phase 1 — Launch": {
    phaseTr: "Aşama 1 — Lansman",
    itemsTr: [
      "Akıllı kontrat dağıtımı",
      "Web sitesi ve marka tasarımı",
      "Topluluk oluşturmaya başlanması",
    ],
  },
  "Phase 2 — Presale": {
    phaseTr: "Aşama 2 — Ön Satış",
    itemsTr: [
      "Ön satışın başlatılması",
      "İlk pazarlama itmesi",
      "KOL iş birlikleri",
    ],
  },
  "Phase 3 — Listing": {
    phaseTr: "Aşama 3 — Listeleme",
    itemsTr: [
      "DEX listeleme (PancakeSwap)",
      "Likidite havuzu kurulumu",
      "Lansman sonrası kampanyalar",
    ],
  },
  "Phase 4 — Staking": {
    phaseTr: "Aşama 4 — Staking",
    itemsTr: [
      "Staking paneli",
      "Ödül havuzları",
      "Uzun vadeli teşvikler",
    ],
  },
  "Phase 5 — Expansion": {
    phaseTr: "Aşama 5 — Büyüme",
    itemsTr: [
      "CEX borsa görüşmeleri",
      "Ekosistem araçları",
      "Küresel topluluk etkinlikleri",
    ],
  },
  "Phase 6 — Scale": {
    phaseTr: "Aşama 6 — Ölçekleme",
    itemsTr: [
      "Yeni kullanım alanları",
      "Ortaklık entegrasyonları",
      "Sürdürülebilir büyüme",
    ],
  },
};

const formatNumber = (value: number, decimals: number = 2): string =>
  Number.isFinite(value)
    ? value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : "0";

function LogoBadge(): React.ReactElement {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-lime-400 to-emerald-600 text-lg font-bold text-zinc-950 shadow-lg shadow-emerald-500/40">
      🐍
    </div>
  );
}

function DetailItem({ label, value }: DetailItemProps): React.ReactElement {
  return (
    <div className="h-full cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 transition-colors duration-150 hover:border-emerald-500/60 hover:bg-zinc-900/80">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-zinc-50">{value}</div>
    </div>
  );
}

function SummaryRow({ label, value }: SummaryRowProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-zinc-300">{label}</span>
      <span className="font-semibold text-zinc-100">{value}</span>
    </div>
  );
}

function RoadmapCard({
  phase,
  completed,
  items,
}: RoadmapCardProps): React.ReactElement {
  return (
    <Card className="rounded-2xl border-zinc-800 bg-zinc-950/60 shadow-md shadow-black/30 transition-colors duration-150 hover:border-emerald-500/40 hover:shadow-emerald-500/10">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        {completed ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        ) : (
          <Clock className="h-5 w-5 text-zinc-400" />
        )}
        <CardTitle className="text-base font-semibold">{phase}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-1 text-sm text-zinc-300">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function Page(): React.ReactElement {
  const [lang, setLang] = useState<Language>("en");
  const [payMethod, setPayMethod] = useState<PayMethod>("USDT");
  const [amount, setAmount] = useState<string>("");
  const [bnbUsdtRate, setBnbUsdtRate] = useState<number>(TOKEN.bnbUsdtRate);

  const parsedAmount = useMemo<number>(() => {
    const numeric = Number(amount.replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return 0;
    }
    return numeric;
  }, [amount]);

  const costInUSDT = useMemo<number>(() => {
    if (parsedAmount <= 0) {
      return 0;
    }
    return parsedAmount * TOKEN.priceUSDT;
  }, [parsedAmount]);

  const costInBNB = useMemo<number>(() => {
    if (
      costInUSDT <= 0 ||
      !Number.isFinite(bnbUsdtRate) ||
      bnbUsdtRate <= 0
    ) {
      return 0;
    }
    return costInUSDT / bnbUsdtRate;
  }, [costInUSDT, bnbUsdtRate]);

  const presaleProgressPercent = Math.min(
    100,
    PRESALE_HARD_CAP > 0 ? (PRESALE_RAISED / PRESALE_HARD_CAP) * 100 : 0,
  );

  // Live BNB/USDT price (Binance)
  useEffect(() => {
    let isMounted = true;

    const fetchBnbPrice = async () => {
      try {
        const res = await fetch(
          "https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT",
        );
        if (!res.ok) return;
        const data: { price: string } = await res.json();
        const price = parseFloat(data.price);
        if (isMounted && Number.isFinite(price) && price > 0) {
          setBnbUsdtRate(price);
        }
      } catch {
        // silent fallback to previous value
      }
    };

    fetchBnbPrice();
    const interval = setInterval(fetchBnbPrice, 60_000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleScrollToPresale = (): void => {
    const element = document.getElementById("presale-panel");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleConnectClick = (): void => {
    toast.info(
      lang === "en"
        ? "Wallet connection will be available soon."
        : "Cüzdan bağlantısı yakında aktif olacak.",
    );
  };

  const handleBuyClick = (): void => {
    if (parsedAmount <= 0) {
      toast.error(
        lang === "en"
          ? "Please enter a valid SNAKE amount."
          : "Lütfen geçerli bir SNAKE miktarı girin.",
      );
      return;
    }

    if (payMethod === "USDT") {
      toast.success(
        lang === "en"
          ? `Buy request submitted: ${formatNumber(
              parsedAmount,
              0,
            )} SNAKE — Estimated cost: ${formatNumber(costInUSDT)} USDT`
          : `Alım isteği gönderildi: ${formatNumber(
              parsedAmount,
              0,
            )} SNAKE — Tahmini maliyet: ${formatNumber(costInUSDT)} USDT`,
      );
      return;
    }

    toast.success(
      lang === "en"
        ? `Buy request submitted: ${formatNumber(
            parsedAmount,
            0,
          )} SNAKE — Estimated cost: ${formatNumber(
            costInBNB,
            6,
          )} BNB (~${formatNumber(costInUSDT)} USDT)`
        : `Alım isteği gönderildi: ${formatNumber(
            parsedAmount,
            0,
          )} SNAKE — Tahmini maliyet: ${formatNumber(
            costInBNB,
            6,
          )} BNB (~${formatNumber(costInUSDT)} USDT)`,
    );
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-zinc-950 to-zinc-900 text-zinc-50">
      <Toaster richColors theme="dark" position="top-right" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <LogoBadge />
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wide text-zinc-200">
                {TOKEN.symbol}
              </span>
              <span className="text-xs text-zinc-500">
                {lang === "en"
                  ? "Community-powered presale on BNB Chain"
                  : "BNB Chain üzerinde topluluk odaklı ön satış"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                  lang === "en"
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("tr")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                  lang === "tr"
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                TR
              </button>
            </div>
            <Button
              variant="outline"
              className="cursor-pointer border-emerald-500/80 bg-zinc-950 text-xs text-emerald-200 hover:bg-emerald-500/10 hover:text-emerald-50 sm:text-sm"
              onClick={handleConnectClick}
            >
              <Wallet className="mr-2 h-4 w-4" />
              {lang === "en" ? "Connect Wallet" : "Cüzdanı Bağla"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-10">
        {/* Hero + Presale Panel */}
        <section className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          {/* Hero */}
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {lang === "en" ? "Presale Live" : "Ön Satış Aktif"}
            </div>

            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              SNAKE Token
              <span className="block bg-gradient-to-r from-emerald-400 to-lime-300 bg-clip-text pb-2 text-transparent">
                {lang === "en"
                  ? "High-utility, community first."
                  : "Yüksek fayda, önce topluluk."}
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm text-zinc-300 sm:text-base">
              {lang === "en" ? (
                <>
                  Join the early supporters of{" "}
                  <span className="font-semibold">{TOKEN.symbol}</span> on BNB
                  Chain. Fair tokenomics, a transparent roadmap and long-term
                  incentives for holders.
                </>
              ) : (
                <>
                  BNB Chain üzerindeki{" "}
                  <span className="font-semibold">{TOKEN.symbol}</span> tokeninin
                  ilk destekçileri arasına katıl. Adil dağılım, şeffaf bir yol
                  haritası ve uzun vadeli holder ödülleri seni bekliyor.
                </>
              )}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                variant="secondary"
                className="cursor-pointer px-7 text-sm font-semibold"
                onClick={handleScrollToPresale}
              >
                {lang === "en" ? "Join Presale" : "Ön Satışa Katıl"}
              </Button>
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("tokenomics-section")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-300 hover:text-zinc-50"
              >
                {lang === "en" ? "View Tokenomics" : "Tokenomikleri Gör"}
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <DetailItem
                label={lang === "en" ? "Total Supply" : "Toplam Arz"}
                value={TOKEN.totalSupply.toLocaleString("en-US")}
              />
              <DetailItem
                label={lang === "en" ? "Presale Price" : "Ön Satış Fiyatı"}
                value={`1 ${TOKEN.symbol} = ${TOKEN.priceUSDT} USDT`}
              />
              <DetailItem
                label={lang === "en" ? "Network" : "Ağ"}
                value={
                  <span>
                    {lang === "en" ? "BNB Chain (BEP-20)" : "BNB Zinciri (BEP-20)"}
                  </span>
                }
              />
            </div>
          </div>

          {/* Presale Panel */}
          <div className="w-full max-w-xl lg:max-w-md">
            <Card
              id="presale-panel"
              className="rounded-2xl border-zinc-800 bg-zinc-950/70 shadow-xl shadow-emerald-500/10 transition-colors duration-150 hover:border-emerald-500/40"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {lang === "en"
                    ? `Presale Panel — Buy ${TOKEN.symbol}`
                    : `Ön Satış Paneli — ${TOKEN.symbol} Satın Al`}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Amount */}
                <div className="space-y-2">
                  <Label
                    htmlFor="snake-amount"
                    className="text-xs text-zinc-300"
                  >
                    {lang === "en"
                      ? `Amount (${TOKEN.symbol})`
                      : `Miktar (${TOKEN.symbol})`}
                  </Label>
                  <Input
                    id="snake-amount"
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    value={amount}
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>,
                    ): void => {
                      setAmount(event.target.value);
                    }}
                    className="appearance-none border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-emerald-500/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    placeholder={lang === "en" ? "e.g. 1000" : "örn. 1000"}
                  />
                  <p className="text-xs text-zinc-400">
                    {lang === "en" ? "Price" : "Fiyat"}: 1 {TOKEN.symbol} ={" "}
                    {TOKEN.priceUSDT} USDT
                  </p>
                </div>

                {/* Pay with */}
                <div className="space-y-3 pt-1">
                  <Label className="text-xs text-zinc-300">
                    {lang === "en" ? "Pay with" : "Ödeme yöntemi"}
                  </Label>
                  <div className="flex justify-start">
                    <Tabs
                      value={payMethod}
                      onValueChange={(value: string): void =>
                        setPayMethod(value as PayMethod)
                      }
                      className="w-full"
                    >
                      <TabsList className="grid w-full max-w-[260px] grid-cols-2 items-center rounded-full border border-zinc-700 bg-zinc-900/80 p-1 text-xs shadow-inner shadow-black/40">
                        <TabsTrigger
                          value="USDT"
                          className="flex h-9 w-full cursor-pointer items-center justify-center rounded-full px-3 font-medium text-zinc-300 transition-colors duration-150 data-[state=active]:bg-emerald-500 data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
                        >
                          USDT (BEP-20)
                        </TabsTrigger>
                        <TabsTrigger
                          value="BNB"
                          className="flex h-9 w-full cursor-pointer items-center justify-center rounded-full px-3 font-medium text-zinc-300 transition-colors duration-150 data-[state=active]:bg-emerald-500 data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
                        >
                          BNB
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <p className="text-xs text-zinc-300">
                    {lang === "en" ? (
                      <>
                        If you choose BNB, an indicative live rate from Binance
                        is used. Current reference: 1 BNB ≈{" "}
                        {formatNumber(bnbUsdtRate || TOKEN.bnbUsdtRate)} USDT.
                      </>
                    ) : (
                      <>
                        BNB ile ödeme yaptığınızda Binance'ten alınan yaklaşık
                        piyasa fiyatı kullanılır. Güncel referans: 1 BNB ≈{" "}
                        {formatNumber(bnbUsdtRate || TOKEN.bnbUsdtRate)} USDT.
                      </>
                    )}
                  </p>
                </div>

                <Separator className="bg-zinc-800" />

                {/* Summary */}
                <div className="space-y-3">
                  <SummaryRow
                    label={
                      lang === "en"
                        ? "You pay (estimated)"
                        : "Ödeyeceğiniz tutar (tahmini)"
                    }
                    value={
                      payMethod === "USDT"
                        ? `${formatNumber(costInUSDT)} USDT`
                        : `${formatNumber(
                            costInBNB,
                            6,
                          )} BNB (~${formatNumber(costInUSDT)} USDT)`
                    }
                  />
                  <SummaryRow
                    label={
                      lang === "en" ? "You receive" : "Alacağınız miktar"
                    }
                    value={
                      parsedAmount > 0
                        ? `${parsedAmount.toLocaleString("en-US")} ${
                            TOKEN.symbol
                          }`
                        : `0 ${TOKEN.symbol}`
                    }
                  />
                  <p className="text-[11px] leading-snug text-zinc-400">
                    {lang === "en" ? (
                      <>
                        Values are estimates based on live market data. Final
                        price is confirmed on-chain at the time of purchase.
                      </>
                    ) : (
                      <>
                        Değerler anlık piyasa verilerine göre yaklaşık olarak
                        hesaplanır. Nihai fiyat, satın alma anında zincir
                        üzerinde kesinleşir.
                      </>
                    )}
                  </p>
                </div>
              </CardContent>

              {/* Actions */}
              <CardFooter className="flex flex-col gap-3 border-t border-zinc-800 bg-zinc-950/80 py-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="outline"
                  className="cursor-pointer border-emerald-500/80 bg-zinc-950 text-xs text-emerald-200 hover:bg-emerald-500/10 hover:text-emerald-50 sm:text-sm"
                  onClick={handleConnectClick}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {lang === "en" ? "Connect Wallet" : "Cüzdanı Bağla"}
                </Button>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Button
                    className="flex-1 cursor-pointer bg-emerald-500 font-semibold text-zinc-900 shadow-md shadow-emerald-500/25 hover:bg-emerald-400 sm:flex-none"
                    onClick={handleBuyClick}
                  >
                    {lang === "en" ? "Buy Now" : "Hemen Satın Al"}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled
                    className="flex-1 sm:flex-none"
                  >
                    {lang === "en" ? "Claim (soon)" : "Claim (yakında)"}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Presale status + How to buy */}
        <section className="space-y-4" aria-label="Presale info">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
            {/* Presale status */}
            <Card className="rounded-2xl border-zinc-800 bg-zinc-950/70 shadow-sm shadow-black/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  {lang === "en" ? "Presale Status" : "Ön Satış Durumu"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 text-sm text-zinc-200">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                  <span>
                    {lang === "en" ? "Raised" : "Toplanan"}:{" "}
                    {PRESALE_RAISED.toLocaleString("en-US")} /{" "}
                    {PRESALE_HARD_CAP.toLocaleString("en-US")} USDT
                  </span>
                  <span className="text-zinc-400">
                    {lang === "en" ? "Soft cap" : "Soft cap"}{" "}
                    {PRESALE_SOFT_CAP.toLocaleString("en-US")} USDT
                  </span>
                </div>
                <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-zinc-900">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${presaleProgressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>
                    {lang === "en" ? "Sale progress" : "Satış ilerlemesi"}
                  </span>
                  <span>{formatNumber(presaleProgressPercent, 2)}%</span>
                </div>
              </CardContent>
            </Card>

            {/* How to buy */}
            <Card className="rounded-2xl border-zinc-800 bg-zinc-950/70 shadow-sm shadow-black/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  {lang === "en" ? "How to Buy" : "Nasıl Satın Alınır?"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-xs text-zinc-200 sm:text-sm">
                <ol className="space-y-1.5 list-decimal pl-4">
                  <li>
                    {lang === "en"
                      ? "Install a Web3 wallet (MetaMask, Trust Wallet, SafePal, etc.)."
                      : "MetaMask, Trust Wallet veya SafePal gibi bir Web3 cüzdanı kur."}
                  </li>
                  <li>
                    {lang === "en"
                      ? "Deposit BNB or USDT (BEP-20) into your wallet."
                      : "Cüzdanına BNB veya USDT (BEP-20) yükle."}
                  </li>
                  <li>
                    {lang === "en" ? (
                      <>
                        Connect your wallet on this site, choose USDT or BNB in
                        the presale panel, enter the {TOKEN.symbol} amount and
                        confirm the transaction.
                      </>
                    ) : (
                      <>
                        Bu sitede cüzdanını bağla, ön satış panelinden USDT veya
                        BNB'yi seç, almak istediğin {TOKEN.symbol} miktarını gir
                        ve işlemi onayla.
                      </>
                    )}
                  </li>
                  <li>
                    {lang === "en" ? (
                      <>After the presale ends, claim your SNAKE tokens.</>
                    ) : (
                      <>Ön satış bittikten sonra SNAKE tokenlerini Claim et.</>
                    )}
                  </li>
                </ol>
                <p className="pt-1 text-[11px] text-zinc-400">
                  {lang === "en"
                    ? "Always double-check the official links from the Telegram and X (Twitter) channels."
                    : "Resmi bağlantıları daima Telegram ve X (Twitter) kanallarından doğruladığından emin ol."}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="bg-zinc-800/80" />

        {/* Token details */}
        <section
          aria-label="Token details"
          className="space-y-5"
          id="token-details"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">
              {lang === "en" ? "Token Details" : "Token Detayları"}
            </h2>
            <span className="text-xs text-zinc-400">
              {lang === "en"
                ? "Transparent distribution and long-term alignment."
                : "Şeffaf dağıtım ve uzun vadeli hizalanma."}
            </span>
          </div>

          <Card className="rounded-2xl border-zinc-800 bg-zinc-950/70 shadow-sm shadow-black/20">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <DetailItem
                label={lang === "en" ? "Total Supply" : "Toplam Arz"}
                value={TOKEN.totalSupply.toLocaleString("en-US")}
              />
              <DetailItem
                label={
                  lang === "en" ? "Presale Allocation" : "Ön Satış Ayrılan Miktar"
                }
                value={
                  lang === "en"
                    ? "25% of total supply"
                    : "Toplam arzın %25'i"
                }
              />
              <DetailItem
                label={lang === "en" ? "Listing Target" : "Listeleme Hedefi"}
                value={
                  lang === "en"
                    ? "PancakeSwap, 2–3 months post-presale"
                    : "PancakeSwap, ön satıştan 2–3 ay sonra"
                }
              />
              <DetailItem
                label={
                  lang === "en"
                    ? "Accepted Currencies"
                    : "Kabul Edilen Para Birimleri"
                }
                value="USDT (BEP-20), BNB"
              />
              <DetailItem
                label={lang === "en" ? "Claim Time" : "Claim Zamanı"}
                value={
                  lang === "en"
                    ? "After presale finalization"
                    : "Ön satış tamamlandıktan sonra"
                }
              />
              <DetailItem
                label={
                  lang === "en" ? "Locked Tokens" : "Kilitli Tokenler"
                }
                value={
                  lang === "en" ? (
                    <>
                      {LOCKED_TOKENS.toLocaleString("en-US")} (locked for 6
                      months)
                    </>
                  ) : (
                    <>
                      {LOCKED_TOKENS.toLocaleString("en-US")} (6 ay kilitli)
                    </>
                  )
                }
              />
              <DetailItem
                label={
                  lang === "en" ? "Contract Address" : "Kontrat Adresi"
                }
                value={
                  <span className="break-all font-mono text-xs text-emerald-300 sm:text-sm">
                    {TOKEN.contractAddress}
                  </span>
                }
              />
            </CardContent>
          </Card>
        </section>

        {/* Tokenomics */}
        <section
          aria-label="Tokenomics"
          className="space-y-5"
          id="tokenomics-section"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">
              {lang === "en" ? "Tokenomics" : "Tokenomik"}
            </h2>
            <span className="text-xs text-zinc-400">
              {lang === "en"
                ? "Balanced allocations for growth, liquidity and rewards."
                : "Büyüme, likidite ve ödüller için dengeli dağılım."}
            </span>
          </div>

          <Card className="rounded-2xl border-zinc-800 bg-zinc-950/70 shadow-sm shadow-black/20">
            <CardContent className="grid gap-6 py-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center">
              <ul className="space-y-2 text-sm">
                {TOKENOMICS.map((slice) => (
                  <li
                    key={slice.name}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 transition-colors duration-150 hover:border-emerald-500/50 hover:bg-zinc-900/80"
                  >
                    <span className="text-zinc-200">
                      {lang === "en" ? slice.name : slice.nameTr}
                    </span>
                    <span className="font-semibold text-zinc-50">
                      {slice.value}%
                    </span>
                  </li>
                ))}
              </ul>

              <div className="h-64 w-full min-w-0 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={TOKENOMICS}
                      dataKey="value"
                      nameKey={lang === "en" ? "name" : "nameTr"}
                      outerRadius={100}
                      innerRadius={55}
                      stroke="#020617"
                    >
                      {TOKENOMICS.map((slice, index) => (
                        <Cell
                          key={slice.name}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderRadius: 10,
                        border: "1px solid #27272a",
                        fontSize: 12,
                        color: "#ffffff",
                        padding: "8px 10px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.55)",
                      }}
                      labelStyle={{
                        color: "#f9fafb",
                        marginBottom: 4,
                      }}
                      itemStyle={{
                        color: "#e5e7eb",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11, color: "#e5e5e5" }}
                      iconSize={10}
                      verticalAlign="bottom"
                      height={32}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Roadmap */}
        <section aria-label="Roadmap" className="space-y-5" id="roadmap">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">
              {lang === "en" ? "Roadmap" : "Yol Haritası"}
            </h2>
            <span className="text-xs text-zinc-400">
              {lang === "en"
                ? "Milestones to deliver a sustainable ecosystem."
                : "Sürdürülebilir bir ekosistem için hedeflenen aşamalar."}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ROADMAP.map((phase) => {
              const translation = ROADMAP_TRANSLATIONS[phase.phase];
              const phaseTitle =
                lang === "en" || !translation
                  ? phase.phase
                  : translation.phaseTr;
              const phaseItems =
                lang === "en" || !translation
                  ? phase.items
                  : translation.itemsTr;

              return (
                <RoadmapCard
                  key={phase.phase}
                  phase={phaseTitle}
                  completed={phase.completed}
                  items={phaseItems}
                />
              );
            })}
          </div>
        </section>

        {/* Game section placeholder */}
        <section
          aria-label="Snake game teaser"
          className="space-y-4"
          id="game-section"
        >
          <div className="rounded-2xl border border-emerald-500/40 bg-zinc-950/70 p-6 text-center shadow-sm shadow-emerald-500/10">
            <p className="text-base font-semibold sm:text-lg">
              {lang === "en"
                ? "🎮 Snake Game Coming Soon"
                : "🎮 Snake Oyunu Çok Yakında"}
            </p>
            <p className="mt-2 text-sm text-zinc-300">
              {lang === "en"
                ? "Earn $SNAKE while playing!"
                : "Ön satışa katıl, oyundaki başarılarınla ekstra SNAKE kazan."}
            </p>
            <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
              {lang === "en"
                ? "A Play-to-Earn arcade experience launching soon. Compete, score, and win."
                : "Yakında başlayacak bir Play-to-Earn arcade deneyimi. Yarış, skor yap ve kazan."}
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-black/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-7 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <LogoBadge />
            <div>
              <div className="text-sm font-semibold text-zinc-100">
                {TOKEN.name}
              </div>
              <p className="mt-1 max-w-xs text-xs text-zinc-400">
                {lang === "en" ? (
                  <>
                    Experimental, community-driven token on BNB Chain. Always
                    do your own research. No guarantees or investment advice.
                  </>
                ) : (
                  <>
                    BNB Chain üzerinde deneysel, topluluk odaklı bir token.
                    Yatırım kararlarını kendi araştırmana göre ver; hiçbir
                    garanti veya yatırım tavsiyesi sunulmaz.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm text-zinc-300">
            <div className="font-semibold">
              {lang === "en" ? "Social" : "Sosyal"}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="https://x.com/memsnake"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex cursor-pointer items-center gap-2 text-xs text-zinc-300 hover:text-zinc-50"
              >
                <Twitter className="h-4 w-4" />
                {lang === "en" ? "X (Twitter)" : "X (Twitter)"}
              </a>
              <a
                href="https://t.me/Snkglobal"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex cursor-pointer items-center gap-2 text-xs text-zinc-300 hover:text-zinc-50"
              >
                <Send className="h-4 w-4" />
                Telegram
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-800/80 py-4">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 text-[11px] text-zinc-500 sm:flex-row sm:justify-between">
            <span>
              {lang === "en"
                ? `© ${currentYear} ${TOKEN.name}. All rights reserved.`
                : `© ${currentYear} ${TOKEN.name}. Tüm hakları saklıdır.`}
            </span>
            <span className="flex flex-wrap items-center gap-3">
              <span>
                {lang === "en" ? "Audit coming soon" : "Denetim yakında"}
              </span>
              <span className="text-zinc-500/80">
                {lang === "en"
                  ? "View on BscScan (soon)"
                  : "BscScan'de görüntüle (yakında)"}
              </span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
