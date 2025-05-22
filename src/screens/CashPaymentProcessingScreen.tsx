// CashPaymentProcessingScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface Customer {
  customerId:   number;
  name:         string;
  address:      string;
  phoneNumber:  string;
}

const CashPaymentProcessingScreen: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading]       = useState(true);
  const [customers, setCustomers]   = useState<Customer[]>([]);
  const [selected, setSelected]     = useState<Customer | null>(null);
  const [amount, setAmount]         = useState('');

  useEffect(() => {
    axios
      .get<Customer[]>(
        'http://10.0.2.2:8080/api/employee/payments/customers/week?offset=0',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(res => setCustomers(res.data))
      .catch(() => Alert.alert('Error', 'Couldn’t load customers'))
      .finally(() => setLoading(false));
  }, [token]);

  const submitPayment = () => {
    if (!selected || !amount.trim()) {
      return Alert.alert('Missing', 'Select a customer and enter amount');
    }

    axios
      .post(
        'http://10.0.2.2:8080/api/employee/payments/cash',
        {
          customerId: selected.customerId,
          amount:     parseFloat(amount),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        Alert.alert('Saved', 'Payment recorded');
        setSelected(null);
        setAmount('');
      })
      .catch(() => Alert.alert('Error', 'Failed to save payment'));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select Customer</Text>
      <FlatList
        data={customers}
        keyExtractor={c => c.customerId.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelected(item)}
            style={[
              styles.item,
              selected?.customerId === item.customerId && styles.selected,
            ]}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sub}>{item.address}</Text>
            <Text style={styles.sub}>{item.phoneNumber}</Text>
          </TouchableOpacity>
        )}
      />

      {selected && (
        <View style={styles.form}>
          <Text style={styles.label}>
            Amount received from {selected.name}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          <TouchableOpacity style={styles.button} onPress={submitPayment}>
            <Text style={styles.buttonText}>Submit Payment</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default CashPaymentProcessingScreen;

const styles = StyleSheet.create({
  container:  { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  header:     { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  item:       {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 8,
  },
  selected:   { borderColor: '#4CAF50', borderWidth: 2 },
  name:       { fontSize: 16, color: '#333', fontWeight: '600' },
  sub:        { fontSize: 14, color: '#666' },
  form:       { marginTop: 16, padding: 12, backgroundColor: '#fff', borderRadius: 6 },
  label:      { marginBottom: 8, fontSize: 16 },
  input:      {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  button:     { backgroundColor: '#4CAF50', padding: 12, borderRadius: 6 },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 16 },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
