import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const AUTH_ROUTES = ['/user/login', '/user/register']

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = AUTH_ROUTES.some((r) => error.config?.url?.includes(r))
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
