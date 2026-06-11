import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { useToast } from '@/composables/useToast'

export interface ApiResponse<T = any> {
  code: string | number
  success?: boolean
  message?: string
  data: T
  error?: unknown
  errors?: unknown
}

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

type InternalConfig = AxiosRequestConfig & { headers?: any }

api.interceptors.request.use(
  (config: InternalConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config as any
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    const res: ApiResponse = response.data
    const ok =
      res.success === true ||
      res.code === 0 ||
      res.code === 200 ||
      res.code === 'SUCCESS'
    if (!ok) {
      const { showToast } = useToast()
      showToast(res.message || '业务错误', 'error')
      return Promise.reject(res)
    }
    return res.data
  },
  (error: AxiosError<ApiResponse>) => {
    const { showToast } = useToast()
    const status = error.response?.status
    const message = error.response?.data?.message || error.message

    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      showToast('登录已过期，请重新登录', 'error')
    } else {
      showToast(message || '请求失败', 'error')
    }

    return Promise.reject({
      code: status || -1,
      message,
      data: null,
    })
  }
)

export default api
