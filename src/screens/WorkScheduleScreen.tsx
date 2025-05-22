import React, { useEffect, useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
  StatusBar,
  SafeAreaView,
} from 'react-native'
import apiClient from '../api/apiClient'

interface Appointment {
  appointmentId: number
  customerName: string
  serviceName: string
  scheduledDate: string
  status: AppointmentStatus
  address: string
}

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'ON ROUTE' | 'STARTED' | 'COMPLETED' | 'CANCELLED'

interface StatusStyle {
  color: string
  bgColor: string
  icon: string
}


const STATUS_STYLES: Record<AppointmentStatus, StatusStyle> = {
  PENDING: { color: '#4CAF50', bgColor: '#E8F5E9', icon: '⏱️' },
  CONFIRMED: { color: '#1976D2', bgColor: '#E3F2FD', icon: '✅' },
  'ON ROUTE': { color: '#FF9800', bgColor: '#FFF3E0', icon: '🚗' },
  STARTED: { color: '#F57C00', bgColor: '#FFF8E1', icon: '🔧' },
  COMPLETED: { color: '#388E3C', bgColor: '#E8F5E9', icon: '✓' },
  CANCELLED: { color: '#757575', bgColor: '#EEEEEE', icon: '✕' },
}

const DEFAULT_STATUS_STYLE: StatusStyle = { color: '#1976D2', bgColor: '#E3F2FD', icon: '❓' }


const STATUS_FLOW: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['ON ROUTE', 'CANCELLED'],
  'ON ROUTE': ['STARTED', 'CANCELLED'],
  STARTED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7) // 7 AM to 7 PM
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const MIN_CELL_WIDTH = 120
const MIN_CELL_HEIGHT = 65
const HOUR_COLUMN_WIDTH = 65
const HEADER_HEIGHT = 48
const PADDING = 16

const getMonday = (date: Date) => {
  const newDate = new Date(date)
  const day = newDate.getDay()
  const diff = newDate.getDate() - (day === 0 ? 6 : day - 1)
  newDate.setDate(diff)
  newDate.setHours(0, 0, 0, 0)
  return newDate
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatFullDate = (date: Date) => {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

const getStatusStyle = (status: string): StatusStyle => {

  if (status in STATUS_STYLES) {
    return STATUS_STYLES[status as AppointmentStatus]
  }
  return DEFAULT_STATUS_STYLE
}


const getStatusActionLabel = (status: AppointmentStatus): string => {
  switch (status) {
    case 'CONFIRMED': return 'Confirm Appointment'
    case 'ON ROUTE': return 'Mark On Route'
    case 'STARTED': return 'Start Service'
    case 'COMPLETED': return 'Mark Completed'
    case 'CANCELLED': return 'Cancel Appointment'
    default: return status
  }
}

const WorkScheduleScreen: React.FC = () => {
  const { width, height } = useWindowDimensions()
  const isTablet = width >= 600

  const [weekOffset, setWeekOffset] = useState(0)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const monday = useMemo(() => {
    const date = getMonday(new Date())
    date.setDate(date.getDate() + weekOffset * 7)
    return date
  }, [weekOffset])

  const weekDates = useMemo(() => {
    return DAYS.map((_, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      return date
    })
  }, [monday])

  useEffect(() => {
    loadAppointments()
  }, [weekOffset])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const { data } = await apiClient.get<Appointment[]>(`/employee/schedule/week?offset=${weekOffset}`)
      setAppointments(data)
    } catch (error) {
      Alert.alert('Error', 'Failed to load schedule. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const updateAppointmentStatus = async (id: number, newStatus: AppointmentStatus) => {
    try {
      setStatusUpdating(true)
      
      let endpoint = '';
      switch(newStatus) {
        case 'CONFIRMED':
          endpoint = `/employee/appointments/${id}/confirm`;
          break;
        case 'ON ROUTE':
          endpoint = `/employee/appointments/${id}/on-route`;
          break;
        case 'STARTED':
          endpoint = `/employee/appointments/${id}/start`;
          break;
        case 'COMPLETED':
          endpoint = `/employee/appointments/${id}/complete`;
          break;
        case 'CANCELLED':
          endpoint = `/employee/appointments/${id}/cancel`;
          break;
        default:
          throw new Error(`Unsupported status transition: ${newStatus}`);
      }
      
      await apiClient.post(endpoint)
      
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.appointmentId === id 
            ? { ...appointment, status: newStatus } 
            : appointment
        )
      )
      
      if (selectedAppointment && selectedAppointment.appointmentId === id) {
        setSelectedAppointment({
          ...selectedAppointment,
          status: newStatus
        })
      }
      
      Alert.alert('Success', `Appointment status updated to ${newStatus}`)
    } catch (error) {
      Alert.alert('Error', 'Failed to update appointment status')
    } finally {
      setStatusUpdating(false)
    }
  }

  const cellWidth = isTablet 
    ? Math.max(MIN_CELL_WIDTH, (width - HOUR_COLUMN_WIDTH - PADDING * 2) / 7) 
    : width - PADDING * 2

  const tableHeight = HEADER_HEIGHT + HOURS.length * MIN_CELL_HEIGHT
  const frameHeight = height - 180 
  
  const findAppointment = (dayIndex: number, hour: number) => {
    return appointments.find(appointment => {
      const appointmentDate = new Date(appointment.scheduledDate)
      return appointmentDate.getDay() === ((dayIndex + 1) % 7) && appointmentDate.getHours() === hour
    })
  }

  if (!isTablet) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <View style={styles.nonTablet}>
          <Text style={styles.nonTabletText}>This schedule view is optimized for tablet devices</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => loadAppointments()}
          >
            <Text style={styles.buttonText}>Refresh Data</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#388E3C" />
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.navigationButton} 
          onPress={() => setWeekOffset(prev => prev - 1)}
        >
          <Text style={styles.navigationButtonText}>Previous Week</Text>
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.weekTitle}>
            {weekOffset === 0 ? 'Current Week' : `Week of ${formatFullDate(monday)}`}
          </Text>
          <Text style={styles.dateRange}>
            {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.navigationButton} 
          onPress={() => setWeekOffset(prev => prev + 1)}
        >
          <Text style={styles.navigationButtonText}>Next Week</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.legend}>
        {Object.entries(STATUS_STYLES).map(([status, style]) => (
          <View key={status} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: style.color }]} />
            <Text style={styles.legendText}>{status}</Text>
          </View>
        ))}
      </View>

      <ScrollView 
        style={{ maxHeight: frameHeight }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          <View>
            <View style={styles.row}>
              <View style={[styles.cell, styles.hourHeaderCell, { width: HOUR_COLUMN_WIDTH, height: HEADER_HEIGHT }]} />
              
              {weekDates.map((date, index) => (
                <View 
                  key={`day-${index}`} 
                  style={[
                    styles.cell, 
                    styles.dayHeaderCell, 
                    { 
                      width: cellWidth, 
                      height: HEADER_HEIGHT,
                      backgroundColor: date.getDate() === new Date().getDate() && 
                                     date.getMonth() === new Date().getMonth() &&
                                     date.getFullYear() === new Date().getFullYear()
                                     ? '#E8F5E9' : '#388E3C'
                    }
                  ]}
                >
                  <Text style={styles.dayName}>{DAYS[index]}</Text>
                  <Text style={styles.dayDate}>{date.getDate()}</Text>
                </View>
              ))}
            </View>
            
            {HOURS.map(hour => (
              <View key={`hour-${hour}`} style={styles.row}>
                <View 
                  style={[
                    styles.cell, 
                    styles.hourHeaderCell, 
                    { width: HOUR_COLUMN_WIDTH, height: MIN_CELL_HEIGHT }
                  ]}
                >
                  <Text style={styles.hourText}>
                    {hour % 12 === 0 ? 12 : hour % 12}{hour >= 12 ? 'pm' : 'am'}
                  </Text>
                </View>
                
                {DAYS.map((_, dayIndex) => {
                  const appointment = findAppointment(dayIndex, hour)
                  
                  if (!appointment) {
                    return (
                      <View 
                        key={`cell-${dayIndex}-${hour}`} 
                        style={[
                          styles.cell, 
                          styles.emptyCell, 
                          { width: cellWidth, height: MIN_CELL_HEIGHT }
                        ]} 
                      />
                    )
                  }
                  
                  const statusStyle = getStatusStyle(appointment.status)
                  
                  return (
                    <TouchableOpacity 
                      key={`cell-${dayIndex}-${hour}`} 
                      style={[
                        styles.cell, 
                        { width: cellWidth, height: MIN_CELL_HEIGHT, padding: 4 }
                      ]} 
                      onPress={() => setSelectedAppointment(appointment)}
                    >
                      <View 
                        style={[
                          styles.appointmentCard, 
                          { 
                            borderLeftColor: statusStyle.color,
                            backgroundColor: statusStyle.bgColor 
                          }
                        ]}
                      >
                        <View style={styles.appointmentHeader}>
                          <Text style={styles.appointmentTime}>
                            {new Date(appointment.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                          <Text style={[styles.statusIndicator, { color: statusStyle.color }]}>
                            {statusStyle.icon}
                          </Text>
                        </View>
                        <Text numberOfLines={1} style={styles.customerName}>
                          {appointment.customerName}
                        </Text>
                        <Text numberOfLines={1} style={styles.serviceName}>
                          {appointment.serviceName}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      {selectedAppointment && (
        <Modal
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedAppointment(null)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedAppointment.serviceName}</Text>
                <TouchableOpacity onPress={() => setSelectedAppointment(null)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.appointmentDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Customer:</Text>
                  <Text style={styles.detailValue}>{selectedAppointment.customerName}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedAppointment.scheduledDate).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(new Date(selectedAppointment.scheduledDate))}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text style={styles.detailValue}>{selectedAppointment.address}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusStyle(selectedAppointment.status).bgColor }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusStyle(selectedAppointment.status).color }
                    ]}>
                      {selectedAppointment.status}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.statusUpdateSection}>
                <Text style={styles.statusUpdateTitle}>Update Status</Text>
                
                {statusUpdating ? (
                  <View style={styles.statusLoadingContainer}>
                    <ActivityIndicator size="small" color="#4CAF50" />
                    <Text style={styles.statusLoadingText}>Updating status...</Text>
                  </View>
                ) : (
                  <View style={styles.statusActionButtons}>
                    {STATUS_FLOW[selectedAppointment.status as AppointmentStatus].map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusButton,
                          { backgroundColor: getStatusStyle(status).bgColor }
                        ]}
                        onPress={() => updateAppointmentStatus(selectedAppointment.appointmentId, status)}
                      >
                        <Text style={[styles.statusButtonText, { color: getStatusStyle(status).color }]}>
                          {getStatusActionLabel(status)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    
                    {STATUS_FLOW[selectedAppointment.status as AppointmentStatus].length === 0 && (
                      <Text style={styles.noActionsText}>
                        No further status updates available
                      </Text>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => setSelectedAppointment(null)}
                >
                  <Text style={styles.actionButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: PADDING,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navigationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  navigationButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
  },
  weekTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  dateRange: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
    marginTop: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#616161',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  horizontalScrollContent: {
    paddingRight: 20,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayHeaderCell: {
    backgroundColor: '#388E3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourHeaderCell: {
    backgroundColor: '#424242',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  dayDate: {
    color: '#fff',
    fontSize: 12,
  },
  hourText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyCell: {
    backgroundColor: '#fafafa',
  },
  appointmentCard: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 6,
    borderLeftWidth: 4,
    padding: 6,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appointmentTime: {
    fontSize: 10,
    color: '#616161',
  },
  statusIndicator: {
    fontSize: 12,
    fontWeight: '700',
  },
  customerName: {
    color: '#212121',
    fontWeight: '600',
    fontSize: 12,
  },
  serviceName: {
    fontSize: 11,
    color: '#616161',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  closeButton: {
    fontSize: 20,
    color: '#757575',
    padding: 4,
  },
  appointmentDetails: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    width: 80,
    fontWeight: '600',
    color: '#616161',
  },
  detailValue: {
    flex: 1,
    color: '#212121',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 12,
  },
  statusUpdateSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusUpdateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  statusActionButtons: {
    flexDirection: 'column',
    gap: 10,
  },
  statusButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  statusLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  statusLoadingText: {
    marginLeft: 8,
    color: '#616161',
    fontSize: 14,
  },
  noActionsText: {
    textAlign: 'center',
    color: '#757575',
    fontStyle: 'italic',
    padding: 8,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#616161',
  },
  nonTablet: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  nonTabletText: {
    fontSize: 18,
    color: '#616161',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
})

export default WorkScheduleScreen