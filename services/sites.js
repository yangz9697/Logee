import request from './request';

// 获取站点和目的地数据
export const getSiteDestinations = () => {
  return request({
    url: '/site-destinations',
    method: 'GET'
  });
}; 