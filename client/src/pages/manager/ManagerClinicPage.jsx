import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { ROLES } from '../../auth/roles'
import { PlaceholderPage } from '../common/PlaceholderPage'

export function ManagerClinicPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isManager = user?.role === ROLES.MANAGER

  if (!isManager) {
    return <PlaceholderPage title="Клиника" />
  }

  return (
    <section className="content-card doctor-page">
      <div className="doctor-page-head">
        <div>
          <h1>Управление клиникой</h1>
          <p>Раздел для менеджера: настройка услуг и расписания врачей.</p>
        </div>

        <div className="doctor-head-actions">
          <span className="role-pill">Режим менеджера</span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/manager/clinic/services')}
          style={{
            border: '1px solid #dce2ec',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            background: '#ffffff',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#1f5fb8'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(31, 95, 184, 0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#dce2ec'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div style={{ marginBottom: '0.8rem' }}>
            <div
              style={{
                fontSize: '2rem',
                marginBottom: '0.5rem',
              }}
            >
              📋
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', color: '#1d2433' }}>
              Услуги клиники
            </h3>
          </div>
          <p style={{ margin: 0, color: '#59637a', fontSize: '0.95rem' }}>
            Управление справочником услуг: название, длительность и стоимость приема.
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/manager/clinic/schedule-exceptions')}
          style={{
            border: '1px solid #dce2ec',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            background: '#ffffff',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#1f5fb8'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(31, 95, 184, 0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#dce2ec'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div style={{ marginBottom: '0.8rem' }}>
            <div
              style={{
                fontSize: '2rem',
                marginBottom: '0.5rem',
              }}
            >
              ⏸️
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', color: '#1d2433' }}>
              Исключения расписания
            </h3>
          </div>
          <p style={{ margin: 0, color: '#59637a', fontSize: '0.95rem' }}>
            Управление временными недоступностями врачей: болезни, отпуска, обучение.
          </p>
        </button>
      </div>
    </section>
  )
}
