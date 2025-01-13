// 云函数入口文件
const cloud = require('wx-server-sdk')
const request = require('request-promise')

cloud.init()

// 基础配置
const BASE_URL = 'http://49.234.42.166:3001/api'

// 云函数入口函数
exports.main = async (event, context) => {
  const { url, method = 'GET', data, headers = {} } = event

  try {
    const response = await request({
      url: `${BASE_URL}${url}`,
      method: method.toUpperCase(),
      body: data,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      json: true // 自动解析 JSON 响应
    })

    // 返回响应数据
    return {
      code: 200,
      result: response.result,
      message: response.message || 'success'
    }

  } catch (error) {
    console.error('请求失败:', error)
    
    // 处理错误响应
    if (error.statusCode || error.status) {
      return {
        code: error.statusCode || error.status,
        message: error.message || '请求失败'
      }
    }

    // 处理网络错误
    return {
      code: 500,
      message: error.message || '服务器内部错误'
    }
  }
}