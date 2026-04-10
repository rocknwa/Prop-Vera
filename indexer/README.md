# PropVera Subgraph

This subgraph indexes all PropVera contract events on Cronos Testnet into a queryable GraphQL API.

## Overview

The subgraph provides efficient querying for:
- Asset listings and marketplace data
- Fractional ownership positions
- Share trading listings
- Seller statistics
- Protocol-wide analytics
- Faucet drip tracking

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update `subgraph.yaml` with actual contract addresses and startBlock:
   - Find PropVera deployment block on [Cronos Explorer](https://explorer.cronos.org/testnet)
   - Update `address` fields with deployed contract addresses
   - Update `startBlock` with the deployment block number

3. Generate types:
```bash
npm run codegen
```

4. Build the subgraph:
```bash
npm run build
```

## Deployment

### Goldsky (Recommended)

1. Create a Goldsky account at https://goldsky.com
2. Install Goldsky CLI:
```bash
npm install -g @goldskycom/cli
```

3. Authenticate:
```bash
goldsky login
```

4. Deploy:
```bash
goldsky subgraph deploy propvera-subgraph/1.0.0 --path .
```

### Alternative: Envio

If Goldsky doesn't support Cronos EVM yet:

1. Sign up at https://envio.dev
2. Follow their deployment guide for custom networks

## Query Examples

Once deployed, you'll get a GraphQL endpoint. Here are example queries:

### Get Available Assets
```graphql
query GetAvailableAssets($first: Int!, $skip: Int!) {
  assets(
    first: $first, skip: $skip,
    where: { verified: true, sold: false },
    orderBy: createdAt, orderDirection: desc
  ) {
    id
    tokenId
    seller { address }
    priceInEth
    tokenURI
    isFractionalized
    fractionalData {
      totalTokens
      remainingTokens
      pricePerToken
    }
  }
}
```

### Get User's Portfolio
```graphql
query GetUserPortfolio($user: Bytes!) {
  positions(where: { holder: $user }) {
    asset {
      tokenId
      tokenURI
      fractionalData {
        totalTokens
        pricePerToken
      }
    }
    tokensOwned
    investedAmount
  }
}
```

### Get Active Share Listings
```graphql
query GetActiveShareListings($first: Int!, $skip: Int!) {
  shareListings(
    first: $first, skip: $skip,
    where: { active: true },
    orderBy: createdAt, orderDirection: desc
  ) {
    asset { tokenId tokenURI }
    seller
    numShares
    pricePerShare
    createdAt
  }
}
```

### Get Protocol Stats
```graphql
query GetProtocolStats {
  protocolStats(id: "stats") {
    totalAssets
    totalVerifiedAssets
    totalSoldAssets
    totalFractionalizedAssets
    totalSellers
    totalVolumeUSDC
  }
}
```

### Get Seller Stats
```graphql
query GetSellerStats($seller: Bytes!) {
  seller(id: $seller) {
    address
    registeredAt
    confirmedSales
    canceledSales
    assets {
      tokenId
      sold
      priceInEth
    }
  }
}
```

## Schema

See `schema.graphql` for the complete entity definitions.

## Testing

To test locally with The Graph:

1. Install Docker
2. Start local Graph Node:
```bash
npm run create-local
npm run deploy-local
```

3. Query at http://localhost:8000/subgraphs/name/propvera-subgraph

## Frontend Integration

Replace direct RPC calls in the frontend with GraphQL queries using `@tanstack/react-query` + `graphql-request`.

Example replacement for `fetchAllAssetsWithDisplayInfo()`:

```typescript
import { gql } from 'graphql-request';

const GET_AVAILABLE_ASSETS = gql`
  query GetAvailableAssets($first: Int!, $skip: Int!) {
    assets(
      first: $first, skip: $skip,
      where: { verified: true, sold: false },
      orderBy: createdAt, orderDirection: desc
    ) {
      id tokenId seller { address } priceInEth tokenURI isFractionalized
      fractionalData { totalTokens remainingTokens pricePerToken }
    }
  }
`;

// Use with react-query
const { data } = useQuery({
  queryKey: ['assets', first, skip],
  queryFn: () => request(endpoint, GET_AVAILABLE_ASSETS, { first, skip })
});
```

## Support

For issues with:
- Goldsky: https://docs.goldsky.com
- The Graph: https://thegraph.com/docs
- AssemblyScript: https://www.assemblyscript.org