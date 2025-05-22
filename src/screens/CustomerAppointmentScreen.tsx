import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import apiClient from '../api/apiClient';

type AppointmentScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'CustomerAppointments'
>;

type Appointment = {
  appointmentId: number;
  scheduledDate: string;
  serviceName: string;
  status: string;
  staffName: string;
  address: string;
};

const AppointmentScreen = () => {
  const navigation = useNavigation<AppointmentScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past' | 'Pending'>('Upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const fetchAppointments = async () => {
    try {
      const past = activeTab === 'Past';
      const { data } = await apiClient.get<Appointment[]>('/customer/appointments', {
        params: { past },
      });
      setAppointments(data);
    } catch (err) {
      console.error('Failed to fetch appointments', err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [activeTab]);

  const filteredAppointments = appointments.filter(app => {
    if (activeTab === 'Pending') return app.status === 'PENDING';
    if (activeTab === 'Upcoming') return ['CONFIRMED', 'PENDING'].includes(app.status);
    return ['COMPLETED', 'CANCELLED'].includes(app.status);
  });

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>My Appointments</Text>
      </View>

      <View style={styles.tabContainer}>
        {['Upcoming', 'Past', 'Pending'].map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab as 'Upcoming' | 'Past' | 'Pending')}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.appointmentList}>
        {filteredAppointments.map((appointment) => (
          <View key={appointment.appointmentId} style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
              <Image
                source={{ uri: 'https://via.placeholder.com/50' }}
                style={styles.providerImage}
              />
              <View style={styles.appointmentInfo}>
                <Text style={styles.serviceType}>{appointment.serviceName}</Text>
                <Text style={styles.dateTime}>
                  {new Date(appointment.scheduledDate).toLocaleString()}
                </Text>
              </View>
              <View style={[
                styles.statusContainer,
                appointment.status === 'CONFIRMED' && styles.statusConfirmed,
                appointment.status === 'PENDING' && styles.statusPending,
                appointment.status === 'COMPLETED' && styles.statusCompleted,
                appointment.status === 'CANCELLED' && styles.statusCancelled,
              ]}>
                <Text style={styles.statusText}>{appointment.status}</Text>
              </View>
            </View>
            <Text style={styles.providerName}>Staff: {appointment.staffName}</Text>
            <Text style={styles.location}>Address: {appointment.address}</Text>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Reschedule</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {filteredAppointments.length === 0 && (
          <Text style={styles.noAppointments}>
            No appointments found for {activeTab}.
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('CustomerDashboard')}
        >
          <Text style={styles.footerItemText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('CustomerAppointments')}
        >
          <Text style={styles.footerItemText}>Appointments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('CustomerAccountScreen')}
        >
          <Text style={styles.footerItemText}>Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerItem}
          onPress={() => navigation.navigate('BookService')}
          >
          <Text style={styles.footerItemText}>Book Service</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
  },
  topBar: {
    backgroundColor: '#388E3C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  backButton: {
    color: '#FFFFFF',
    fontSize: 18,
    marginRight: 10,
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#424242',
    paddingVertical: 10,
  },
  tabItem: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#757575',
  },
  tabItemActive: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  tabTextActive: {
    fontWeight: 'bold',
  },
  appointmentList: {
    paddingHorizontal: 10,
    paddingBottom: 80,
  },
  appointmentCard: {
    backgroundColor: '#424242',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  providerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  appointmentInfo: {
    flex: 1,
  },
  serviceType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  dateTime: {
    fontSize: 14,
    color: '#BDBDBD',
  },
  statusContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  statusConfirmed: {
    backgroundColor: '#4CAF50',
  },
  statusPending: {
    backgroundColor: '#FFC107',
  },
  statusCompleted: {
    backgroundColor: '#388E3C',
  },
  statusCancelled: {
    backgroundColor: '#F44336',
  },
  providerName: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  location: {
    fontSize: 14,
    color: '#BDBDBD',
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  noAppointments: {
    textAlign: 'center',
    color: '#FFFFFF',
    marginVertical: 20,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#388E3C',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
  },
  footerItem: {
    paddingHorizontal: 5,
  },
  footerItemText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default AppointmentScreen;