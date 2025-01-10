import request from './request';

// 获取枚举数据
export const getEnums = () => {
  return request({
    url: '/enums',
    method: 'GET'
  });
}; 