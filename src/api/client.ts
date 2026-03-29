import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15_000,
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error ?? 'Data unavailable — try again.'
    return Promise.reject(new Error(msg))
  }
)
