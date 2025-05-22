import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';
import { User } from '../navigation/types';

interface LoginResponse {
  token: string;
  username: string;
  roles: string[];
}

interface LoginCredentials {
  username: string;
  password: string;
}

export const login = async (credentials: LoginCredentials): Promise<{ token: string; user: User }> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
  const { token, username, roles } = response.data;

  // Determine role
  let role: User['role'] = 'customer';
  if (roles.includes('ROLE_ADMIN')) {
    role = 'admin';
  } else if (roles.includes('ROLE_EMPLOYEE')) {
    role = 'employee';
  }

  const user: User = {
    id: 0, // You don't have the ID, set a default if needed
    name: username,
    email: `${username}@placeholder.com`,
    role,
  };

  await AsyncStorage.multiSet([
    ['authToken', token],
    ['userData', JSON.stringify(user)],
  ]);

  return { token, user };
};

export const logout = async (): Promise<void> => {
  await AsyncStorage.multiRemove(['authToken', 'userData']);
};

export const getAuthToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem('authToken');
};

export const getUserData = async (): Promise<User | null> => {
  const raw = await AsyncStorage.getItem('userData');
  return raw ? JSON.parse(raw) : null;
};
