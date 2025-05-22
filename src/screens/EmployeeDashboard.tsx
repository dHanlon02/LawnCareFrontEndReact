import React, { useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  useWindowDimensions,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'

const EmployeeDashboard = () => {
  const navigation = useNavigation()
  const { logout } = useAuth()
  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width)).current
  const { width } = useWindowDimensions()
  const tabletThreshold = 600

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [slideAnim])

  if (width < tabletThreshold) {
    return (
      <View style={styles.nonTabletContainer}>
        <Text style={styles.nonTabletText}>
          Employee dashboard is tablet-only. Please use a tablet device.
        </Text>
      </View>
    )
  }

  const metrics = {
    todaysJobs: 6,
    pendingPayments: 3,
    upcomingLeave: 1,
    invoicesThisWeek: 4,
  }

  const go = (screen: string) => navigation.navigate(screen as never)

  const handleLogout = async () => {
    try {
      await logout()
      navigation.navigate('Login' as never)
    } catch {}
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Employee Dashboard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>{metrics.todaysJobs}</Text>
            <Text style={styles.metricLabel}>Today’s Jobs</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>{metrics.pendingPayments}</Text>
            <Text style={styles.metricLabel}>Pending Payments</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>{metrics.upcomingLeave}</Text>
            <Text style={styles.metricLabel}>Upcoming Leave</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>{metrics.invoicesThisWeek}</Text>
            <Text style={styles.metricLabel}>Invoices This Week</Text>
          </View>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionButton} onPress={() => go('WorkSchedule')}>
            <Text style={styles.optionButtonText}>Work Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={() => go('TimeOff')}>
            <Text style={styles.optionButtonText}>Book Holiday / Time-Off</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={() => go('PaymentsScreen')}>
            <Text style={styles.optionButtonText}>Confirm Payments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={() => go('Invoices')}>
            <Text style={styles.optionButtonText}>Invoices</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={() => go('BookAppointment')}>
            <Text style={styles.optionButtonText}>Book Appointment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={handleLogout}>
          <Text style={styles.footerButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  nonTabletContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  nonTabletText: { fontSize: 18, color: '#F44336', textAlign: 'center' },
  header: { backgroundColor: '#388E3C', padding: 15, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: '#424242',
    width: '47%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  metricNumber: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50' },
  metricLabel: { fontSize: 14, color: '#fff', marginTop: 5 },
  optionsContainer: { marginBottom: 20 },
  optionButton: {
    backgroundColor: '#388E3C',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  optionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#388E3C',
    height: 60,
  },
  footerButton: { paddingHorizontal: 20, paddingVertical: 10 },
  footerButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
})

export default EmployeeDashboard
