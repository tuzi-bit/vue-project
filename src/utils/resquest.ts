import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

// 响应数据接口
interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

// 请求配置扩展接口
interface RequestConfig extends AxiosRequestConfig {
  // 是否显示loading
  showLoading?: boolean
  // 是否显示错误提示
  showError?: boolean
}

class HttpRequest {
  private instance: AxiosInstance
  private readonly baseConfig: AxiosRequestConfig = {
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  constructor(config?: AxiosRequestConfig) {
    // 创建axios实例
    this.instance = axios.create({ ...this.baseConfig, ...config })
    // 设置拦截器
    this.setupInterceptors()
  }

  // 配置请求拦截器
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // 在发送请求之前做些什么
        // 例如：添加token
        const token = localStorage.getItem('token')
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        // 对请求错误做些什么
        return Promise.reject(error)
      },
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const { data } = response
        // 根据业务状态码处理
        if (data.code === 200 || data.code === 0) {
          return response
        }
        // 处理业务错误
        this.handleBusinessError(data)
        return Promise.reject(data)
      },
      (error) => {
        // 处理HTTP错误
        this.handleHttpError(error)
        return Promise.reject(error)
      },
    )
  }

  // 处理业务错误
  private handleBusinessError(data: ApiResponse): void {
    const { code, message } = data
    switch (code) {
      case 401:
        // token过期或未授权
        console.error('未授权，请重新登录')
        // 可以在这里跳转到登录页
        // router.push('/login')
        break
      case 403:
        console.error('拒绝访问')
        break
      case 404:
        console.error('请求资源不存在')
        break
      default:
        console.error(message || '请求失败')
    }
  }

  // 处理HTTP错误
  private handleHttpError(error: any): void {
    if (error.response) {
      const { status } = error.response
      switch (status) {
        case 400:
          console.error('请求参数错误')
          break
        case 401:
          console.error('未授权，请重新登录')
          break
        case 403:
          console.error('拒绝访问')
          break
        case 404:
          console.error('请求资源不存在')
          break
        case 500:
          console.error('服务器内部错误')
          break
        default:
          console.error(`请求失败: ${status}`)
      }
    } else if (error.request) {
      console.error('网络错误，请检查网络连接')
    } else {
      console.error('请求配置错误')
    }
  }

  // GET请求
  public get<T = any>(url: string, params?: object, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, url, method: 'GET', params })
  }

  // POST请求
  public post<T = any>(url: string, data?: object, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, url, method: 'POST', data })
  }

  // PUT请求
  public put<T = any>(url: string, data?: object, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, url, method: 'PUT', data })
  }

  // DELETE请求
  public delete<T = any>(url: string, params?: object, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, url, method: 'DELETE', params })
  }

  // PATCH请求
  public patch<T = any>(url: string, data?: object, config?: RequestConfig): Promise<T> {
    return this.request<T>({ ...config, url, method: 'PATCH', data })
  }

  // 上传文件
  public upload<T = any>(url: string, file: File, config?: RequestConfig): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)
    return this.request<T>({
      ...config,
      url,
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  // 下载文件
  public download(url: string, params?: object, config?: RequestConfig): Promise<Blob> {
    return this.instance
      .get(url, {
        ...config,
        params,
        responseType: 'blob',
      })
      .then((response) => response.data)
  }

  // 通用请求方法
  public request<T = any>(config: RequestConfig): Promise<T> {
    return new Promise((resolve, reject) => {
      this.instance
        .request<any, AxiosResponse<ApiResponse<T>>>(config)
        .then((response) => {
          resolve(response.data.data)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  // 获取axios实例
  public getInstance(): AxiosInstance {
    return this.instance
  }
}

// 创建默认实例
const http = new HttpRequest()

// 导出类和默认实例
export { HttpRequest, http }
export default http
