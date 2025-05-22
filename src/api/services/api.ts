import { format } from 'date-fns';
import type { EarningsData } from '../../navigation/types';
import type { Invoice } from '../../navigation/types';

const BASE_URL = 'http://10.0.2.2:8080/api';

export async function fetchEarnings(start: Date, end: Date): Promise<EarningsData[]> {
  const from = format(start, 'yyyy-MM-dd');
  const to = format(end, 'yyyy-MM-dd');
  const res = await fetch(`${BASE_URL}/api/admin/earnings?from=${from}&to=${to}`);
  if (!res.ok) throw new Error('Failed to load earnings');
  return res.json();
}

export async function fetchInvoices(period: 'month' | 'year'): Promise<Invoice[]> {
  const now = new Date();
  const param = period === 'month' ? format(now, 'yyyy-MM') : format(now, 'yyyy');
  const res = await fetch(`${BASE_URL}/api/admin/invoices?${period}=${param}`);
  if (!res.ok) throw new Error('Failed to load invoices');
  return res.json();
}

export async function downloadInvoicePdf(period: 'month' | 'year'): Promise<void> {
  const now = new Date();
  const param = period === 'month' ? format(now, 'yyyy-MM') : format(now, 'yyyy');
  const res = await fetch(`${BASE_URL}/api/admin/reports/invoices/pdf?${period}=${param}`);
  if (!res.ok) throw new Error('Failed to download PDF');
}