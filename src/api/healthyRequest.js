// 养生模块单独Axios
import axios from 'axios'
import teacherStore from '../pages/teacher/store'
import studentStore from '../pages/student/store'
import { getToken, getEntry } from '@/utils/auth'
import { Toast } from 'vant'

const entry = getEntry() // 入口
let url = 'https://all.bnuz.edu.cn' // 本地代理
switch (process.env.NODE_ENV) {
  case 'development':
    url = '' // 开发环境url
    break
  case 'test':
    url = 'http://172.31.44.162' // 测试环境url
    break
  case 'production':
    url = 'https://all.bnuz.edu.cn' // 生产环境url
    break
}
url = url + process.env.VUE_APP_BASE_API + '/health'
// 创建axios实例
const service = axios.create({
  baseURL: url, // 主路径
  withCredentials: true, // 允许跨域携带cookie
  timeout: 5000 // 时延
})

// 设置 post、put 默认 Content-Type
service.defaults.headers.post['Content-Type'] = 'application/json'
service.defaults.headers.put['Content-Type'] = 'application/json'

// request拦截
service.interceptors.request.use(config => {
  if (entry === 'student') {
    if (studentStore.getters.token) {
      config.headers['X-Token'] = getToken(entry)
    }
  } else {
    if (teacherStore.getters.token) {
      config.headers['X-Token'] = getToken(entry)
    }
  }
  return config
},
error => {
  console.log(error) // 打印错误
  return Promise.reject(error)
}
)

// reponse 拦截
service.interceptors.response.use(response => {
  const res = response.data
  if (res.code !== 200) {
    Toast.fail(res.detail || res.msg)
    // 50008:非法令牌;50012:其他客户登录;50014:令牌过期;
    if (res.code === 5008 || res.code === 50012 || res.code === 50014) {
      Toast.fail('您已登出，请重新登录')
      if (entry === 'student') {
        studentStore.dispatch('user/resetToken').then(() => {
          location.reload()
        })
      } else {
        teacherStore.dispatch('user/resetToken').then(() => {
          location.reload()
        })
      }
    }
    return Promise.reject(response)
  } else {
    if (response.detail) {
      Toast(response.detail)
    }
    return res
  }
},
(error) => {
  return Promise.reject(error)
}
)

export default service
