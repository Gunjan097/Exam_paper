import Cookies from 'js-cookie'
import api from './api'

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password })
  Cookies.set('accessToken', data.data.accessToken, { expires: 1 / 96 }) // 15 min
  return data.data.user
}

export const register = async (name, email, password) => {
  const { data } = await api.post('/auth/register', { name, email, password })
  Cookies.set('accessToken', data.data.accessToken, { expires: 1 / 96 })
  return data.data.user
}

export const logout = () => {
  Cookies.remove('accessToken')
  window.location.href = '/login'
}

export const getAccessToken = () => Cookies.get('accessToken')
