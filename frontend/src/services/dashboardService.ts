/**
 * Dashboard API Service
 * Handles dashboard data, statistics, and user activity
 */

import { api } from '../utils/apiClient';
import type {
  APIResponse,
  DashboardSummary,
  DashboardStats
} from '../types/api';

/**
 * Get dashboard summary data
 * Parallel requests optimized with Promise.all
 *
 * @returns Dashboard summary with recent activity
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await api.get<APIResponse<DashboardSummary>>(
    '/api/dashboard/summary'
  );
  return response.data;
}

/**
 * Get dashboard statistics
 *
 * @returns Dashboard statistics including trends
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get<APIResponse<DashboardStats>>(
    '/api/dashboard/stats'
  );
  return response.data;
}

/**
 * Get both summary and stats in parallel
 * Optimized for dashboard page loading
 *
 * @returns Combined dashboard data
 */
export async function getDashboardData(): Promise<{
  summary: DashboardSummary;
  stats: DashboardStats;
}> {
  const [summary, stats] = await Promise.all([
    getDashboardSummary(),
    getDashboardStats()
  ]);

  return { summary, stats };
}

/**
 * Refresh dashboard data
 * Use for manual refresh actions
 *
 * @returns Updated dashboard data
 */
export async function refreshDashboard(): Promise<{
  summary: DashboardSummary;
  stats: DashboardStats;
}> {
  return getDashboardData();
}
