export interface Asset {
  id: string;
  type: string;
  title: string;
  description: string;
  location?: string;
  totalShares: number;
  availableShares: number;
  pricePerShare: number;
  totalValue: number;
  image?: string;
  seller: string;
  createdAt: Date;
  status: "active" | "completed" | "pending";
}

export interface UserPortfolio {
  totalInvested: number;
  totalValue: number;
  unrealizedGains: number;
  realizedGains: number;
  shares: PortfolioShare[];
}

export interface PortfolioShare {
  assetId: string;
  assetTitle: string;
  numberOfShares: number;
  pricePerShare: number;
  totalValue: number;
  purchaseDate: Date;
  currentValue: number;
  gains: number;
}

export interface Transaction {
  id: string;
  type: "buy" | "sell" | "earnings" | "stake" | "unstake";
  assetId?: string;
  amount: number;
  timestamp: Date;
  status: "pending" | "completed" | "failed";
  txHash?: string;
}

export interface UserProfile {
  address: string;
  username?: string;
  email?: string;
  portfolio: UserPortfolio;
  transactions: Transaction[];
  isVerified: boolean;
  joinedDate: Date;
}

export interface DashboardMetrics {
  totalInvested: number;
  currentPortfolioValue: number;
  totalEarnings: number;
  activeAssets: number;
  pendingTransactions: number;
}
