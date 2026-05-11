import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      await login(username, password)
      navigate('/home')
    } catch (err) {
      const message =
        err.response?.data?.error?.message || err.message || 'Неверный логин или пароль.'
      setError(message)
    }
  }

  return (
    <section className="auth-card">
      <h1>Вход в систему</h1>
      <form className="auth-form" onSubmit={onSubmit}>
        <label>
          Логин
          <input
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Введите логин"
            required
          />
        </label>

        <label>
          Пароль
          <input
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Введите пароль"
            required
          />
        </label>

        {error && <p className="error-text">{error}</p>}

        <button type="submit">Войти</button>
      </form>

      <button className="link-button" type="button">
        Сбросить пароль
      </button>
    </section>
  )
}
