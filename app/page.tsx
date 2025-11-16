"use client";

import React, { useState, useMemo } from "react";
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
  value: number;
  [key: string]: string | number;
}

const TOKEN = {
  name: "SNAKE Token",
  symbol: "SNAKE",
  totalSupply: 200_000_000,
  priceUSDT: 0.02,
  bnbUsdtRate: 300,
  contractAddress: "",
};

const TOKENOMICS: TokenomicsSlice[] = [
  { name: "Presale", value: 25 },
  { name: "Liquidity", value: 20 },
  { name: "Staking & Rewards", value: 15 },
  { name: "Team & Advisors", value: 10 },
  { name: "Marketing", value: 15 },
  { name: "Reserve", value: 10 },
  { name: "Airdrop & Community", value: 5 },
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
    <div className="h-full cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 transition hover:border-emerald-500/60 hover:bg-zinc-900/80">
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
    <Card className="rounded-2xl border-zinc-800 bg-zinc-950/60 shadow-md shadow-black/30">
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
  const [payMethod, setPayMethod] = useState<PayMethod>("USDT");
  const [amount, setAmount] = useState<string>("");

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
    if (costInUSDT <= 0) {
      return 0;
    }
    return costInUSDT / TOKEN.bnbUsdtRate;
  }, [costInUSDT]);

  const handleScrollToPresale = (): void => {
    const element = document.getElementById("presale-panel");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleBuyClick = (): void => {
    if (parsedAmount <= 0) {
      toast.error("Please enter a valid SNAKE amount.");
      return;
    }

    if (payMethod === "USDT") {
      toast.success(
        `Buy request submitted: ${formatNumber(
          parsedAmount,
          0,
        )} SNAKE — Estimated cost: ${formatNumber(costInUSDT)} USDT`,
      );
      return;
    }

    toast.success(
      `Buy request submitted: ${formatNumber(
        parsedAmount,
        0,
      )} SNAKE — Estimated cost: ${formatNumber(
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
                Community-powered presale on BNB Chain
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="cursor-pointer border-emerald-500/80 bg-zinc-950 text-xs text-emerald-200 hover:bg-emerald-500/10 hover:text-emerald-50 sm:text-sm"
              onClick={() =>
                toast.info("Wallet connection will be available soon.")
              }
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-14 px-4 pb-16 pt-10">
        {/* Hero + Presale Panel */}
        <section className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          {/* Hero */}
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Presale Live
            </div>

            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              SNAKE Token
              <span className="block bg-gradient-to-r from-emerald-400 to-lime-300 bg-clip-text pb-2 text-transparent">
                High-utility, community first.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm text-zinc-300 sm:text-base">
              Join the early supporters of{" "}
              <span className="font-semibold">{TOKEN.symbol}</span> on BNB
              Chain. Fair tokenomics, transparent roadmap and long-term
              incentives for holders.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                variant="secondary"
                className="cursor-pointer px-7 text-sm font-semibold"
                onClick={handleScrollToPresale}
              >
                Join Presale
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
                View Tokenomics
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <DetailItem
                label="Total Supply"
                value={TOKEN.totalSupply.toLocaleString("en-US")}
              />
              <DetailItem
                label="Presale Price"
                value={`1 ${TOKEN.symbol} = ${TOKEN.priceUSDT} USDT`}
              />
              <DetailItem
                label="Network"
                value={<span>BNB Chain (BEP-20)</span>}
              />
            </div>
          </div>

          {/* Presale Panel */}
          <div className="w-full max-w-xl lg:max-w-md">
            <Card
              id="presale-panel"
              className="rounded-2xl border-zinc-800 bg-zinc-950/70 shadow-xl shadow-emerald-500/10"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  Presale Panel — Buy {TOKEN.symbol}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="snake-amount" className="text-xs text-zinc-300">
                    Amount ({TOKEN.symbol})
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
                    placeholder="e.g. 1000"
                  />
                  <p className="text-xs text-zinc-400">
                    Price: 1 {TOKEN.symbol} = {TOKEN.priceUSDT} USDT
                  </p>
                </div>

                {/* Pay with */}
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-300">Pay with</Label>
                  <Tabs
                    value={payMethod}
                    onValueChange={(value: string): void =>
                      setPayMethod(value as PayMethod)
                    }
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 overflow-hidden rounded-full bg-zinc-900/80 p-0 text-xs shadow-inner shadow-black/40">
                      <TabsTrigger
                        value="USDT"
                        className="flex h-10 w-full cursor-pointer items-center justify-center rounded-full px-3 font-medium text-zinc-300 transition data-[state=active]:bg-emerald-500 data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
                      >
                        USDT (BEP-20)
                      </TabsTrigger>
                      <TabsTrigger
                        value="BNB"
                        className="flex h-10 w-full cursor-pointer items-center justify-center rounded-full px-3 font-medium text-zinc-300 transition data-[state=active]:bg-emerald-500 data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
                      >
                        BNB
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <p className="text-xs text-zinc-300">
                    If you choose BNB, a fixed rate of 1 BNB ={" "}
                    {TOKEN.bnbUsdtRate} USDT will be used for the calculation.
                  </p>
                </div>

                <Separator className="bg-zinc-800" />

                {/* Summary */}
                <div className="space-y-3">
                  <SummaryRow
                    label="You pay (estimated)"
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
                    label="You receive"
                    value={
                      parsedAmount > 0
                        ? `${parsedAmount.toLocaleString("en-US")} ${
                            TOKEN.symbol
                          }`
                        : `0 ${TOKEN.symbol}`
                    }
                  />
                  <p className="text-[11px] leading-snug text-zinc-400">
                    Values are estimates. Final price is confirmed on-chain at
                    the time of purchase.
                  </p>
                </div>
              </CardContent>

              {/* Actions */}
              <CardFooter className="flex flex-col gap-3 border-t border-zinc-800 bg-zinc-950/80 py-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="outline"
                  className="cursor-pointer border-emerald-500/80 bg-zinc-950 text-xs text-emerald-200 hover:bg-emerald-500/10 hover:text-emerald-50 sm:text-sm"
                  onClick={() =>
                    toast.info("Wallet connection will be available soon.")
                  }
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Button
                    className="flex-1 cursor-pointer bg-emerald-500 font-semibold text-zinc-900 shadow-md shadow-emerald-500/25 hover:bg-emerald-400 sm:flex-none"
                    onClick={handleBuyClick}
                  >
                    Buy Now
                  </Button>
                  <Button
                    variant="secondary"
                    disabled
                    className="flex-1 sm:flex-none"
                  >
                    Claim (soon)
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </section>

        <Separator className="bg-zinc-800/80" />

        {/* Token details */}
        <section
          aria-label="Token details"
          className="space-y-6"
          id="token-details"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">
              Token Details
            </h2>
            <span className="text-xs text-zinc-400">
              Transparent distribution and long-term alignment.
            </span>
          </div>

          <Card className="rounded-2xl border-zinc-800 bg-zinc-950/70">
            <CardContent className="grid gap-5 p-6 md:grid-cols-3">
              <DetailItem
                label="Total Supply"
                value={TOKEN.totalSupply.toLocaleString("en-US")}
              />
              <DetailItem
                label="Presale Allocation"
                value="25% of total supply"
              />
              <DetailItem
                label="Listing Target"
                value="PancakeSwap, 2–3 months post-presale"
              />
              <DetailItem
                label="Accepted Currencies"
                value="USDT (BEP-20), BNB"
              />
              <DetailItem
                label="Claim Time"
                value="After presale finalization"
              />
              <DetailItem
                label="Contract Address"
                value={TOKEN.contractAddress || "TBA after audit"}
              />
            </CardContent>
          </Card>
        </section>

        {/* Tokenomics */}
        <section
          aria-label="Tokenomics"
          className="space-y-6"
          id="tokenomics-section"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">Tokenomics</h2>
            <span className="text-xs text-zinc-400">
              Balanced allocations for growth, liquidity and rewards.
            </span>
          </div>

          <Card className="rounded-2xl border-zinc-800 bg-zinc-950/70">
            <CardContent className="grid gap-8 py-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center">
              <ul className="space-y-2 text-sm">
                {TOKENOMICS.map((slice) => (
                  <li
                    key={slice.name}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2"
                  >
                    <span className="text-zinc-200">{slice.name}</span>
                    <span className="font-semibold text-zinc-50">
                      {slice.value}%
                    </span>
                  </li>
                ))}
              </ul>

              <div className="h-72 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={TOKENOMICS}
                      dataKey="value"
                      nameKey="name"
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
                        backgroundColor: "#18181b",
                        borderRadius: 12,
                        border: "1px solid #27272a",
                        fontSize: 12,
                        color: "#e5e5e5",
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
        <section aria-label="Roadmap" className="space-y-6" id="roadmap">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">Roadmap</h2>
            <span className="text-xs text-zinc-400">
              Milestones to deliver a sustainable ecosystem.
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ROADMAP.map((phase) => (
              <RoadmapCard
                key={phase.phase}
                phase={phase.phase}
                completed={phase.completed}
                items={phase.items}
              />
            ))}
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
                Experimental, community-driven token on BNB Chain. Always do
                your own research. No guarantees or investment advice.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-sm text-zinc-300">
            <div className="font-semibold">Social</div>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#"
                className="inline-flex cursor-pointer items-center gap-2 text-xs text-zinc-300 hover:text-zinc-50"
              >
                <Twitter className="h-4 w-4" />
                X (Twitter)
              </a>
              <a
                href="#"
                className="inline-flex cursor-pointer items-center gap-2 text-xs text-zinc-300 hover:text-zinc-50"
              >
                <Send className="h-4 w-4" />
                Telegram
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-800/80 py-4 text-center text-xs text-zinc-500">
          © {currentYear} {TOKEN.name}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
