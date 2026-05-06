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
          <p>Настройка услуг и расписания врачей.</p>
        </div>
      </div>

      <div className="manager-clinic-grid">
        <button
          type="button"
          className="manager-clinic-card"
          onClick={() => navigate('/manager/clinic/services')}
        >
          <div className="manager-clinic-card-header">
            <h3 className="manager-clinic-card-title">
              Услуги клиники
            </h3>
          </div>
          <p className="manager-clinic-card-text">
            Управление справочником услуг: название, длительность и стоимость приема.
          </p>
        </button>

        <button
          type="button"
          className="manager-clinic-card"
          onClick={() => navigate('/manager/clinic/schedule-exceptions')}
        >
          <div className="manager-clinic-card-header">
            <h3 className="manager-clinic-card-title">
              Исключения расписания
            </h3>
          </div>
          <p className="manager-clinic-card-text">
            Управление временными недоступностями врачей: болезни, отпуска, обучение.
          </p>
        </button>
      </div>
    </section>
  )
}
