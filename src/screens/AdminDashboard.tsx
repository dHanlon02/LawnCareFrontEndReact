import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width)).current;
  const { width } = useWindowDimensions();
  const tabletThreshold = 600; 

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  if (width < tabletThreshold) {
    return (
      <View style={styles.nonTabletContainer}>
        <Text style={styles.nonTabletText}>
          Admin Dashboard is only available on tablets. Please use a tablet device.
        </Text>
      </View>
    );
  }

  const metrics = {
    totalUsers: 250,
    totalAppointments: 45,
    totalEmployees: 10,
    newServices: 5,
  };
  const handleManageServices = () => navigation.navigate('ManageServicesScreen');
  const handleManageUsers = () => navigation.navigate('ManageUsers');
  const handleManageAppointments = () => navigation.navigate('ManageAppointments');
  const handleManagePendingServices = () => navigation.navigate('ManagePendingServices');

  const handleViewReports = () => navigation.navigate('Register');

  const handleLogout = async () => {
    try {
      await logout();
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Summary Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>{metrics.totalUsers}</Text>
            <Text style={styles.metricLabel}>Total Users</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>{metrics.totalAppointments}</Text>
            <Text style={styles.metricLabel}>Appointments</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>{metrics.totalEmployees}</Text>
            <Text style={styles.metricLabel}>Employees</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>{metrics.newServices}</Text>
            <Text style={styles.metricLabel}>New Services</Text>
          </View>
        </View>

        {/* Management Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionButton} onPress={handleManageAppointments}>
            <Text style={styles.optionButtonText}>Manage Appointments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={handleManageServices}>
            <Text style={styles.optionButtonText}>Create/Manage Services</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={handleManagePendingServices}>
            <Text style={styles.optionButtonText}>Manage Pending Appointments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={handleManageUsers}>
            <Text style={styles.optionButtonText}>Manage Employee Accounts</Text>
          </TouchableOpacity>
        </View>

        {/* Additional Tools & Analytics */}
        <View style={styles.additionalSection}>
          <Text style={styles.additionalTitle}>Additional Tools & Analytics</Text>
          <Text style={styles.additionalText}>
            Explore real-time tracking, route optimization, and detailed reporting to enhance operational efficiency.
          </Text>
          <TouchableOpacity style={styles.optionButton} onPress={handleViewReports}>
            <Text style={styles.optionButtonText}>View Reports & Analytics</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={handleLogout}>
          <Text style={styles.footerButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  nonTabletContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  nonTabletText: {
    fontSize: 18,
    color: '#F44336',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#388E3C',
    padding: 15,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
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
  metricNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  metricLabel: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#388E3C',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  optionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  additionalSection: {
    backgroundColor: '#424242',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  additionalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  additionalText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#388E3C',
    height: 60,
  },
  footerButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  footerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdminDashboard;
