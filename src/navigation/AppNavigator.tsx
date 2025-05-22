import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

//admin dash screens
import AdminDashboard from '../screens/AdminDashboard';
import ManageUsersScreen from '../screens/ManageUsersScreen';
import ManageAppointments from '../screens/ManageAppointmentsScreen';
import AddUserScreen from '../screens/AddUsers';
import { ManageServicesScreen } from '../screens/ManageAndCreateServicesScreens';
import { AddServiceScreen } from '../screens/ManageAndCreateServicesScreens';
import { UserDetailsScreen } from '../screens/UserDetailScreens';
import { EditUserScreen } from '../screens/UserDetailScreens';
import AdminAssignmentScreen from '../screens/AdminAssignmentScreen';

import { ReportScreen } from '../screens/ReportScreen';
import { InvoiceListScreen } from '../screens/InvoiceListScreen';

//employee dash screens
import EmployeeDashboard from '../screens/EmployeeDashboard';
import WorkScheduleScreen from '../screens/WorkScheduleScreen';
import PaymentsScreen from '../screens/CashPaymentProcessingScreen';

//import TimeOffScreen from '../screens/TimeOffScreen';
//import InvoicesScreen from '../screens/InvoicesScreen';
//import BookAppointmentScreen from '../screens/BookAppointmentScreen';


//customer dash screens
import CustomerDashboard from '../screens/CustomerDashboard';
import CustomerAppointmentScreen from '../screens/CustomerAppointmentScreen';
import CustomerMoreScreen from '../screens/CustomerMoreScreen';
import CustomerAccountScreen from '../screens/CustomerAccountScreen';
import BookServiceScreen from '../screens/BookServiceScreen';
import UploadPhotoScreen from '../screens/UploadPhotoScreen';
import PhotoGalleryScreen from '../screens/PhotoGalleryScreen';
import CustomerPaymentDetailsScreen from '../screens/CustomerPaymentDetailsScreen';

const Stack = createStackNavigator();

const AppNavigator: React.FC = () => {
  const { token, user, isLoading } = useAuth();
  if (isLoading) return null;

  return (
    <Stack.Navigator>
      {token ? (
        user?.role === 'admin' ? (
          <>
            <Stack.Screen
              name="AdminDashboard"
              component={AdminDashboard}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ManageAppointments"
              component={ManageAppointments}
              options={{ title: 'Manage Appointments', headerShown: true }}
            />
            <Stack.Screen
              name="ManageUsers"
              component={ManageUsersScreen}
              options={{ title: 'Manage Users' }}
            />
            <Stack.Screen
              name="AddUser"
              component={AddUserScreen}
              options={{ title: 'Create User' }}
            />
            <Stack.Screen
              name="ManageServicesScreen"
              component={ManageServicesScreen}
              options={{ title: 'Manage Services' }}
            />
            <Stack.Screen
              name="AddServiceScreen"
              component={AddServiceScreen}
              options={{ title: 'Create Service' }}
            />
            <Stack.Screen
              name="UserDetails"
              component={UserDetailsScreen}
              options={{ title: 'User Details' }}
            />
            <Stack.Screen
              name="EditUser"
              component={EditUserScreen}
              options={{ title: 'Edit User' }}
            />
            <Stack.Screen
              name="ManagePendingServices"
              component={AdminAssignmentScreen}
            />
            <Stack.Screen 
              name="ReportScreen" 
              component={ReportScreen} 
              />
            <Stack.Screen 
              name="InvoiceListScreen" 
              component={InvoiceListScreen} 
              />
          </>
        ) : user?.role === 'employee' ? (
          <>
            <Stack.Screen
              name="EmployeeDashboard"
              component={EmployeeDashboard}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="WorkSchedule"
              component={WorkScheduleScreen}
            />
            <Stack.Screen
              name="PaymentsScreen"
              component={PaymentsScreen}
            />
            {/*   
            <Stack.Screen
              name="TimeOff"
              component={TimeOffScreen}
            />
            <Stack.Screen
              name="BookAppointment"
              component={BookAppointmentScreen}
            /> */}
          </>

        ) : (
          <>
            <Stack.Screen
              name="CustomerDashboard"
              component={CustomerDashboard}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CustomerAppointments"
              component={CustomerAppointmentScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CustomerAccountScreen"
              component={CustomerAccountScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MoreOptions"
              component={CustomerMoreScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="BookService"
              component={BookServiceScreen}
              options={{ title: 'Book a Service' }}
            />
            <Stack.Screen
              name="UploadPhotoScreen"
              component={UploadPhotoScreen}
              options={{ title: 'Upload Photo' }}
            />
            <Stack.Screen
              name="PhotoGalleryScreen"
              component={PhotoGalleryScreen}
              options={{ title: 'Photo Gallery Screen' }}
            />
            <Stack.Screen 
            name="CustomerPaymentDetails"
            component={CustomerPaymentDetailsScreen} 
            options={{ title: 'Customer Payment Screen' }}
             />    
          </>
        )
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;

