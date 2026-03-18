const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "An error occurred",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function getAssets() {
  return apiCall("/assets");
}

export async function getAssetById(id: string) {
  return apiCall(`/assets/${id}`);
}

export async function getUserProfile(address: string) {
  return apiCall(`/users/${address}`);
}

export async function getUserPortfolio(address: string) {
  return apiCall(`/users/${address}/portfolio`);
}

export async function getUserTransactions(address: string) {
  return apiCall(`/users/${address}/transactions`);
}

export async function recordTransaction(data: any) {
  return apiCall("/transactions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
