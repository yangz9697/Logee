import request from './request';

// 登录
export const login = (data) => {
  return request({
    url: '/login',
    method: 'POST',
    data
  });
};

// 注册
export const register = (data) => {
  return request({
    url: '/register',
    method: 'POST',
    data,
  });
};

// 登出
export const logout = () => {
  return request({
    url: '/logout',
    method: 'POST'
  }).finally(() => {
    // 无论成功失败都清除本地存储
    wx.clearStorageSync();
  });
}; 