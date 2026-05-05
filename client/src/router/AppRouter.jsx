import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { ROLES } from '../auth/roles'
import { ProtectedLayout } from '../layout/ProtectedLayout'
import { PublicLayout } from '../layout/PublicLayout'
import { AdminAuditPage } from '../pages/admin/AdminAuditPage'
import { AdminClinicPage } from '../pages/admin/AdminClinicPage'
import { AdminUsersPage } from '../pages/admin/AdminUsersPage'
import { ForbiddenPage } from '../pages/common/ForbiddenPage'
import { HomePage } from '../pages/common/HomePage'
import { LoginPage } from '../pages/common/LoginPage'
import { NotFoundPage } from '../pages/common/NotFoundPage'
import { PatientsPage } from '../pages/common/PatientsPage'
import { SchedulePage } from '../pages/common/SchedulePage'
import { SettingsPage } from '../pages/common/SettingsPage'
import { ManagerClinicPage } from '../pages/manager/ManagerClinicPage'
import { ManagerCreateAppointmentPage } from '../pages/manager/ManagerCreateAppointmentPage'
import { ManagerCreatePatientPage } from '../pages/manager/ManagerCreatePatientPage'
import { ManagerEditSchedulePage } from '../pages/manager/ManagerEditSchedulePage'
import { ManagerScheduleExceptionsPage } from '../pages/manager/ManagerScheduleExceptionsPage'
import { ManagerServicesPage } from '../pages/manager/ManagerServicesPage'

function RoleRoute({ roles, children }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!roles.includes(user.role)) {
    return <ForbiddenPage />
  }

  return children
}

export function AppRouter() {
  const { isAuthenticated, user } = useAuth()

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to='/home' replace />
            ) : (
              <LoginPage />
            )
          }
        />
      </Route>

      <Route element={<ProtectedLayout />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/settings" element={<SettingsPage />} />

        <Route
          path="/manager/patients"
          element={
            <RoleRoute roles={[ROLES.MANAGER]}>
              <PatientsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/manager/patients/new"
          element={
            <RoleRoute roles={[ROLES.MANAGER]}>
              <ManagerCreatePatientPage />
            </RoleRoute>
          }
        />
        <Route
          path="/manager/appointments/new"
          element={
            <RoleRoute roles={[ROLES.MANAGER]}>
              <ManagerCreateAppointmentPage />
            </RoleRoute>
          }
        />
        <Route
          path="/manager/schedule"
          element={
            <RoleRoute roles={[ROLES.MANAGER]}>
              <SchedulePage />
            </RoleRoute>
          }
        />
        <Route
          path="/manager/schedule/edit"
          element={
            <RoleRoute roles={[ROLES.MANAGER]}>
              <ManagerEditSchedulePage />
            </RoleRoute>
          }
        />
        <Route
          path="/manager/clinic"
          element={
            <RoleRoute roles={[ROLES.MANAGER]}>
              <ManagerClinicPage />
            </RoleRoute>
          }
        />
        <Route
          path="/manager/clinic/services"
          element={
            <RoleRoute roles={[ROLES.MANAGER]}>
              <ManagerServicesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/manager/clinic/schedule-exceptions"
          element={
            <RoleRoute roles={[ROLES.MANAGER]}>
              <ManagerScheduleExceptionsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/doctor/patients"
          element={
            <RoleRoute roles={[ROLES.DOCTOR]}>
              <PatientsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/doctor/schedule"
          element={
            <RoleRoute roles={[ROLES.DOCTOR]}>
              <SchedulePage />
            </RoleRoute>
          }
        />

        <Route
          path="/admin/clinic"
          element={
            <RoleRoute roles={[ROLES.ADMIN]}>
              <AdminClinicPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/clinic/users"
          element={
            <RoleRoute roles={[ROLES.ADMIN]}>
              <AdminUsersPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/clinic/audit"
          element={
            <RoleRoute roles={[ROLES.ADMIN]}>
              <AdminAuditPage />
            </RoleRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/home' : '/login'} replace />}
      />
    </Routes>
  )
}
