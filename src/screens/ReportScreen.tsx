// screens/ReportScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { format, subDays, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { fetchInvoices } from '../api/services/api';
import { downloadInvoicePdf } from '../api/services/api';
import { fetchEarnings } from '../api/services/api';
import type { EarningsData } from '../navigation/types';

const screenWidth = Dimensions.get('window').width - 32;
const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
};

export const ReportScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [earnings, setEarnings] = useState<EarningsData[]>([]);
  const [startDate, setStartDate] = useState(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'year'>('week');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchEarnings(startDate, endDate);
      setEarnings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { loadData(); }, [loadData]);

  const chartData = React.useMemo(() => {
    if (!earnings.length) return { labels: [], datasets: [{ data: [] }] };
    const sorted = [...earnings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const labels = sorted.map(item => {
      const d = parseISO(item.date);
      if (timeFrame === 'week') return format(d, 'EEE');
      if (timeFrame === 'month') return format(d, 'd');
      return format(d, 'MMM');
    });
    return { labels, datasets: [{ data: sorted.map(i => i.total) }] };
  }, [earnings, timeFrame]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Date pickers, summary cards omitted for brevity */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <TouchableOpacity onPress={() => setChartType('bar')} style={[styles.toggleBtn, chartType === 'bar' && styles.activeBtn]}>
              <Text style={chartType === 'bar' && styles.activeText}>Bar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setChartType('line')} style={[styles.toggleBtn, chartType === 'line' && styles.activeBtn]}>
              <Text style={chartType === 'line' && styles.activeText}>Line</Text>
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <ActivityIndicator size="large" />
          ) : chartType === 'bar' ? (
            <BarChart
              data={chartData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              fromZero
              yAxisLabel=""
              yAxisSuffix=""
            />
          ) : (
            <LineChart data={chartData} width={screenWidth} height={220} chartConfig={chartConfig} bezier />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { padding: 16 },
  chartSection: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginTop: 16 },
  chartHeader: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
  toggleBtn: { padding: 8, marginHorizontal: 4, borderRadius: 6, backgroundColor: '#eee' },
  activeBtn: { backgroundColor: '#0066cc' },
  activeText: { color: '#fff', fontWeight: 'bold' },
});


