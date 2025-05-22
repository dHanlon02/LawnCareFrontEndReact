import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/apiClient';

const CustomerPaymentDetailsScreen = () => {
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');

  const handlePayment = async () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a positive number.');
      return;
    }

    try {
      await apiClient.post('/customer/payments', { amount: value });
      Alert.alert('Payment Recorded', 'Thank you!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not record payment.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Enter Amount to Pay</Text>
      <ScrollView style={styles.form}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 123.45"
          placeholderTextColor="#aaa"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
          <Text style={styles.payButtonText}>Submit Payment</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default CustomerPaymentDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#212121', padding: 20, paddingTop: 40 },
  header:    { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  form:      { flex: 1 },
  label:     { color: '#fff', fontSize: 14, marginBottom: 4, marginTop: 10 },
  input:     { backgroundColor: '#424242', color: '#fff', padding: 10, borderRadius: 6 },
  payButton: { marginTop: 30, backgroundColor: '#4CAF50', padding: 14, borderRadius: 6, alignItems: 'center' },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
