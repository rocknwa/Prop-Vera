"use client";

import { useAccount } from "wagmi";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { StatCard } from "@/components/stat-card";
import { TransactionItem } from "@/components/transaction-item";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardMetrics, Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Wallet, DollarSign, Zap } from "lucide-react";

// Mock data
const mockMetrics: DashboardMetrics = {
  totalInvested: 45000,
  currentPortfolioValue: 52300,
  totalEarnings: 7300,
  activeAssets: 6,
  pendingTransactions: 2,
};

const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "buy",
    assetId: "1",
    amount: 15000,
    timestamp: new Date("2024-03-15"),
    status: "completed",
    txHash: "0x123456",
  },
  {
    id: "2",
    type: "earnings",
    assetId: "1",
    amount: 250,
    timestamp: new Date("2024-03-10"),
    status: "completed",
  },
  {
    id: "3",
    type: "buy",
    assetId: "2",
    amount: 20000,
    timestamp: new Date("2024-03-05"),
    status: "pending",
  },
  {
    id: "4",
    type: "stake",
    amount: 5000,
    timestamp: new Date("2024-02-28"),
    status: "completed",
  },
];

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    redirect("/");
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Investment Dashboard</h1>
            <p className="text-muted mt-1">Wallet: {address}</p>
          </div>

          {/* Metrics Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              label="Total Invested"
              value={formatCurrency(mockMetrics.totalInvested)}
              icon={<Wallet className="h-5 w-5" />}
            />
            <StatCard
              label="Portfolio Value"
              value={formatCurrency(mockMetrics.currentPortfolioValue)}
              icon={<TrendingUp className="h-5 w-5" />}
              trend={{
                value: 16.2,
                isPositive: true,
              }}
            />
            <StatCard
              label="Total Earnings"
              value={formatCurrency(mockMetrics.totalEarnings)}
              icon={<DollarSign className="h-5 w-5" />}
              trend={{
                value: 12.5,
                isPositive: true,
              }}
            />
            <StatCard
              label="Active Assets"
              value={mockMetrics.activeAssets.toString()}
              icon={<Zap className="h-5 w-5" />}
            />
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Portfolio Section */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Your Portfolio</CardTitle>
                  <CardDescription>
                    View and manage your real estate investments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">Property {i}</h3>
                          <span className="text-sm text-success">+{(i * 3.2).toFixed(1)}%</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted">Shares</p>
                            <p className="font-medium">{100 * i}</p>
                          </div>
                          <div>
                            <p className="text-muted">Value</p>
                            <p className="font-medium">{formatCurrency(15000 * i)}</p>
                          </div>
                          <div>
                            <p className="text-muted">Gains</p>
                            <p className="font-medium text-success">
                              {formatCurrency(2400 * i)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest transactions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockTransactions.slice(0, 4).map((tx) => (
                    <TransactionItem key={tx.id} transaction={tx} />
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
