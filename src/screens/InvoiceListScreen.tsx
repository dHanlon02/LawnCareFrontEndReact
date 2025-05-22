// screens/InvoiceListScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';

import { fetchInvoices, downloadInvoicePdf } from '../api/services/api';
import type { Invoice } from '../navigation/types';

export const InvoiceListScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchInvoices('month');
      setInvoices(data);
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const renderItem = ({ item }: { item: Invoice }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, { flex: 0.5 }]}>{item.invoiceNumber}</Text>
      <Text style={[styles.cell, { flex: 2 }]}>{item.customer}</Text>
      <Text style={[styles.cell, { flex: 1 }]}>{item.date}</Text>
      <Text style={[styles.cell, { flex: 1 }]}>${item.amount.toFixed(2)}</Text>
      <Text
        style={[
          styles.cell,
          { flex: 1 },
          item.status === 'Paid' ? styles.paid : styles.pending,
        ]}
      >
        {item.status}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Monthly Invoices</Text>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => downloadInvoicePdf('month')}
        >
          <Text style={styles.downloadText}>Download PDF</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>No invoices found</Text>
          )}
          ListHeaderComponent={() => (
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { flex: 0.5 }]}>#</Text>
              <Text style={[styles.headerCell, { flex: 2 }]}>Customer</Text>
              <Text style={[styles.headerCell, { flex: 1 }]}>Date</Text>
              <Text style={[styles.headerCell, { flex: 1 }]}>Amount</Text>
              <Text style={[styles.headerCell, { flex: 1 }]}>Status</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  downloadButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  downloadText: { color: '#ffffff', fontWeight: 'bold' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  headerCell: { fontWeight: 'bold', paddingHorizontal: 4 },
  row: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  cell: { fontSize: 14, paddingHorizontal: 4 },
  paid: { color: '#00aa00' },
  pending: { color: '#ff8c00' },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    fontStyle: 'italic',
  },
});