import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

interface AccountSummary {
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  completedAppointments: number;
  totalSpent: number;
  outstandingBalance: number;
}

interface Appointment { status: string; }
interface Payment { paymentId: number; transactionId: string; amount: number; status: string; }

const CustomerAccountScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [editVisible, setEditVisible] = useState(false);
  const [editedProfile, setEditedProfile] = useState<AccountSummary | null>(null);

  useEffect(() => {
    fetchSummary();
    fetchAppointments();
    fetchPayments();
  }, []);

  const fetchSummary = async () => {
    try {
      const { data } = await apiClient.get<AccountSummary>('/customer/account-summary');
      setSummary(data);
    } catch {
      Alert.alert('Error', 'Could not load account summary');
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data } = await apiClient.get<Appointment[]>('/customer/appointments');
      setAppointments(data);
    } catch {
      Alert.alert('Error', 'Could not fetch appointments');
    }
  };

  const fetchPayments = async () => {
    try {
      const { data } = await apiClient.get<Payment[]>('/customer/payments');
      setPayments(data);
    } catch {
      Alert.alert('Error', 'Could not fetch payments');
    }
  };

  const simulatePayment = async (paymentId: number) => {
    try {
      await apiClient.post(`/customer/payments/${paymentId}/pay`);
      fetchSummary();
      fetchPayments();
      Alert.alert('Success', 'Payment completed');
    } catch {
      Alert.alert('Error', 'Payment failed');
    }
  };

  const handleLogout = async () => {
    try { await logout(); }
    catch { Alert.alert('Error', 'Logout failed'); }
  };

  if (!summary) {
    return <View style={styles.loading}><Text>Loading…</Text></View>;
  }

  const outstanding = summary.outstandingBalance.toFixed(2);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Customer Account</Text>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account Summary</Text>
        <Text>Name: {summary.name}</Text>
        <Text>Email: {summary.email}</Text>
        <Text>Phone: {summary.phoneNumber}</Text>
        <Text>Address: {summary.address}</Text>
        <View style={styles.divider}/>
        <Text>Completed Appointments: {summary.completedAppointments}</Text>
        <Text>Total Spent: ${summary.totalSpent.toFixed(2)}</Text>
        <Text>Outstanding Balance: ${outstanding}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pending Payments</Text>
        {payments.filter(p => p.status==='PENDING').map(p => (
          <View key={p.paymentId} style={styles.paymentRow}>
            <Text>Invoice #{p.transactionId}</Text>
            <Text>${p.amount.toFixed(2)}</Text>
            <TouchableOpacity
              style={styles.payBtn}
              onPress={() => simulatePayment(p.paymentId)}
            >
              <Text style={styles.payText}>Pay Now</Text>
            </TouchableOpacity>
          </View>
        )) || <Text>None</Text>}
      </View>

      <TouchableOpacity
        style={[styles.makePaymentBtn, summary.outstandingBalance===0 && styles.disabledBtn]}
        onPress={() => navigation.navigate('CustomerPaymentDetails' as never)}
        disabled={summary.outstandingBalance===0}
      >
        <Text style={styles.makePaymentText}>Make Payment</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:'#f5f5f5' },
  loading: {flex:1,justifyContent:'center',alignItems:'center'},
  title: {fontSize:24,fontWeight:'bold',marginBottom:20,color:'#388E3C'},
  card: {backgroundColor:'#fff',padding:16,borderRadius:10,marginBottom:20},
  sectionTitle: {fontSize:18,fontWeight:'600',marginBottom:10},
  divider: {height:1,backgroundColor:'#ddd',marginVertical:10},
  paymentRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8},
  payBtn:{backgroundColor:'#4CAF50',padding:6,borderRadius:6},
  payText:{color:'#fff'},
  makePaymentBtn:{backgroundColor:'#1976D2',padding:16,borderRadius:10,alignItems:'center',marginBottom:10},
  makePaymentText:{color:'#fff',fontWeight:'bold'},
  disabledBtn:{backgroundColor:'#999'},
  logoutBtn:{backgroundColor:'#F44336',padding:16,borderRadius:10,alignItems:'center'},
  logoutText:{color:'#fff',fontWeight:'bold'},
});

export default CustomerAccountScreen;
