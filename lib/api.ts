/**
 * API client for admin app
 * Direct API calls to Next.js API routes
 */

class ApiClient {
  private baseUrl: string;
  private getHeaders: () => Record<string, string>;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    this.getHeaders = () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      return headers;
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers as Record<string, string>),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to fetch" }));
      throw new Error(error.message || "Request failed");
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string) {
    return this.request<{ success: boolean; data?: { token: string; user: any } }>(
      "/api/auth/admin/login",
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }
    );
  }

  async logout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
  }

  async getSession() {
    const token = localStorage.getItem("admin_token");
    if (!token) return null;
    const user = localStorage.getItem("admin_user");
    return user ? JSON.parse(user) : null;
  }

  // Stats
  async getStats() {
    return this.request("/api/admin/stats");
  }

  // Users
  async getUsers(params?: {
    search?: string;
    filter?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    pageSize?: number;
  }) {
    const searchParams = new URLSearchParams(params as any).toString();
    return this.request(`/api/admin/users?${searchParams}`);
  }

  async updateUser(id: string, data: any) {
    return this.request(`/api/admin/users`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string, permanent: boolean, reason?: string) {
    return this.request(`/api/admin/users`, {
      method: "PATCH",
      body: JSON.stringify({ action: "delete", id, permanent, reason }),
    });
  }

  async adjustBalance(id: string, amount: number, reason: string, type: "credit" | "debit") {
    return this.request(`/api/admin/users`, {
      method: "PATCH",
      body: JSON.stringify({ action: "adjustBalance", userId: id, amount, reason, type }),
    });
  }

  async setUserStatus(id: string, status: "ACTIVE" | "SUSPENDED" | "BANNED") {
    return this.request(`/api/admin/users`, {
      method: "PATCH",
      body: JSON.stringify({ action: "setStatus", userId: id, status }),
    });
  }

  // Services
  async getServices() {
    return this.request("/api/admin/services");
  }

  async createService(data: any) {
    return this.request("/api/admin/services", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateService(id: string, data: any) {
    return this.request("/api/admin/services", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteService(id: string) {
    return this.request(`/api/admin/services/${id}`, {
      method: "DELETE",
    });
  }

  // Promocodes
  async getPromocodes() {
    return this.request("/api/admin/promocodes");
  }

  async generatePromocodes(amount: number, count: number, maxUses: number) {
    return this.request("/api/admin/promocodes", {
      method: "POST",
      body: JSON.stringify({ amount, count, maxUses }),
    });
  }

  async updatePromocode(id: string, action: "activate" | "deactivate") {
    return this.request("/api/admin/promocodes", {
      method: "PATCH",
      body: JSON.stringify({ id, action }),
    });
  }

  async deletePromocode(id: string) {
    return this.request(`/api/admin/promocodes/${id}`, {
      method: "DELETE",
    });
  }

  // Transactions
  async getTransactions(params?: {
    search?: string;
    type?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.type) searchParams.set("type", params.type);
    if (params?.status) searchParams.set("status", params.status);
    searchParams.set("page", String(params?.page || 1));
    searchParams.set("pageSize", String(params?.pageSize || 25));
    return this.request(`/api/admin/transactions?${searchParams.toString()}`);
  }

  async getTransactionStats(startDate?: string, endDate?: string) {
    const searchParams = new URLSearchParams();
    if (startDate) searchParams.set("startDate", startDate);
    if (endDate) searchParams.set("endDate", endDate);
    return this.request(`/api/admin/transactions/stats?${searchParams}`);
  }

  // Settings
  async getSettings() {
    return this.request("/api/admin/settings");
  }

  async updateSettings(data: any) {
    return this.request("/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Servers
  async getServers() {
    return this.request("/api/admin/servers");
  }

  async createServer(data: any) {
    return this.request("/api/admin/servers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateServer(id: string, data: any) {
    return this.request(`/api/admin/servers`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteServer(id: string) {
    return this.request(`/api/admin/servers/${id}`, {
      method: "DELETE",
    });
  }

  // Wallets
  async getWallets() {
    return this.request("/api/admin/wallets");
  }

  // Audit Logs
  async getAuditLogs(params?: {
    userId?: string;
    action?: string;
    page?: number;
    pageSize?: number;
  }) {
    const searchParams = new URLSearchParams(params as any).toString();
    return this.request(`/api/admin/audit-logs?${searchParams}`);
  }
}

export const api = new ApiClient();