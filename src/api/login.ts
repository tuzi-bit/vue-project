import http from '@/utils/resquest'

// 定义接口类型
interface LoginParams {
  username: string
  password: string
}

interface UserInfo {
  id: number
  username: string
  email: string
  avatar: string
  token: string
}

// 登录
export function login(data: LoginParams) {
  return http.post<UserInfo>('/login', data)
}
