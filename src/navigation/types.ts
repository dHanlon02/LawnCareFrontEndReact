export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  CustomerDashboard: undefined;
  EmployeeDashboard: undefined;
  AdminDashboard: undefined;
  CustomerAppointments: undefined;
  MoreOptions: undefined;
  ManageUsers: undefined;
  AddUser: { role: 'employee' | 'admin' };
  UserDetails: { userId: number };
  EditUser: { userId: number; role: 'employee' | 'admin' };
  ManageServicesScreen: undefined;
  AddServiceScreen: undefined;
  ManageAppointments: undefined;
  CustomerAccountScreen : undefined;
  PaymentsScreen : undefined;
  BookService : undefined;
  ManagePendingServices : undefined;
  UploadPhotoScreen : undefined;
  PhotoGalleryScreen : undefined;
  CustomerPaymentDetailsScreen : undefined;
  ReportScreen : undefined;
  InvoiceListScreen : undefined;
  PdfViewerScreen : undefined;
  
};

export interface User {
  id:    number;
  name:  string;
  email: string;
  role:   'customer' | 'admin' | 'employee';
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export interface EarningsData {
  date: string;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | string;
}