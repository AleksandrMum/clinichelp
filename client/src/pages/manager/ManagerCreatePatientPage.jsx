import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const INITIAL_FORM = {
  full_name: '',
  phone: '',
  birth_date: '',
  notes: '',
}

function getTodayIsoDate() {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10)
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (!digits) {
    return ''
  }

  if (digits[0] !== '7' && digits[0] !== '8') {
    return `+7 ${digits}`
  }

  const normalized = `7${digits.slice(1)}`
  const p1 = normalized.slice(1, 4)
  const p2 = normalized.slice(4, 7)
  const p3 = normalized.slice(7, 9)
  const p4 = normalized.slice(9, 11)

  let result = '+7'
  if (p1) result += ` (${p1}`
  if (p1.length === 3) result += ')'
  if (p2) result += ` ${p2}`
  if (p3) result += `-${p3}`
  if (p4) result += `-${p4}`

  return result
}

function validate(values) {
  const errors = {
    full_name: '',
    phone: '',
    birth_date: '',
    notes: '',
  }

  if (!values.full_name.trim()) {
    errors.full_name = 'Укажите ФИО пациента.'
  }

  const phoneDigits = values.phone.replace(/\D/g, '')
  if (!phoneDigits) {
    errors.phone = 'Укажите телефон пациента.'
  } else if (phoneDigits.length !== 11) {
    errors.phone = 'Телефон должен содержать 11 цифр.'
  }

  if (!values.birth_date) {
    errors.birth_date = 'Укажите дату рождения.'
  }

  if (values.notes.length > 1000) {
    errors.notes = 'Заметка не должна превышать 1000 символов.'
  }

  return errors
}

export function ManagerCreatePatientPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({
    full_name: '',
    phone: '',
    birth_date: '',
    notes: '',
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [savedPayload, setSavedPayload] = useState(null)

  const canSubmit = useMemo(
    () =>
      form.full_name.trim() &&
      form.phone.replace(/\D/g, '').length === 11 &&
      form.birth_date,
    [form],
  )

  function handleChange(event) {
    const { name, value } = event.target
    const nextValue = name === 'phone' ? formatPhone(value) : value

    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }))

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitted(true)

    const nextErrors = validate(form)
    setErrors(nextErrors)

    const hasErrors = Object.values(nextErrors).some(Boolean)
    if (hasErrors) {
      setSavedPayload(null)
      return
    }

    setSavedPayload({
      full_name: form.full_name.trim(),
      phone: form.phone,
      birth_date: form.birth_date,
      notes: form.notes.trim(),
    })
  }

  function handleReset() {
    setForm(INITIAL_FORM)
    setErrors({
      full_name: '',
      phone: '',
      birth_date: '',
      notes: '',
    })
    setSavedPayload(null)
    setIsSubmitted(false)
  }

  return (
    <section className="content-card doctor-page">
      <div className="doctor-page-head">
        <div>
          <h1>Создание пациента</h1>
        </div>

        <div className="doctor-head-actions">
          <button type="button" className="button-secondary" onClick={() => navigate('/manager/patients')}>
            К списку пациентов
          </button>
          <span className="role-pill">Режим менеджера</span>
        </div>
      </div>

      <article className="doctor-list-panel" style={{ maxWidth: '880px' }}>
        <div className="panel-header-row">
          <h2>Данные пациента</h2>
        </div>

        <form className="form-grid form-grid-two-col" onSubmit={handleSubmit} noValidate>
          <label>
            <span>ФИО</span>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Например, Иванов Иван Иванович"
              maxLength={150}
              aria-invalid={Boolean(errors.full_name)}
            />
            {errors.full_name ? <span className="error-text">{errors.full_name}</span> : null}
          </label>

          <label>
            <span>Телефон</span>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+7 (___) ___-__-__"
              inputMode="tel"
              aria-invalid={Boolean(errors.phone)}
            />
            {errors.phone ? <span className="error-text">{errors.phone}</span> : null}
          </label>

          <label>
            <span>Дата рождения</span>
            <input
              type="date"
              name="birth_date"
              value={form.birth_date}
              onChange={handleChange}
              max={getTodayIsoDate()}
              aria-invalid={Boolean(errors.birth_date)}
            />
            {errors.birth_date ? <span className="error-text">{errors.birth_date}</span> : null}
          </label>

          <label className="form-span-2">
            <span>Заметки</span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Аллергии, особенности общения, важные комментарии"
              maxLength={1000}
              rows={5}
              aria-invalid={Boolean(errors.notes)}
            />
            <span className="panel-muted">{form.notes.length}/1000</span>
            {errors.notes ? <span className="error-text">{errors.notes}</span> : null}
          </label>

          <div className="button-row form-span-2">
            <button type="submit" disabled={!canSubmit}>
              Сохранить пациента
            </button>
            <button type="button" className="button-secondary" onClick={handleReset}>
              Очистить форму
            </button>
          </div>

          {isSubmitted && !savedPayload ? (
            <p className="panel-feedback form-span-2">
              Не удалось сохранить. Проверьте обязательные поля и корректность телефона.
            </p>
          ) : null}

          {savedPayload ? (
            <div className="form-span-2">
              <p className="panel-feedback">Пациент добавлен.</p>
            </div>
          ) : null}
        </form>
      </article>
    </section>
  )
}
