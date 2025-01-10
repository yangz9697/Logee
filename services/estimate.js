import request from './request';

// 获取估价列表
export const getEstimates = (params) => {
  return request({
    url: '/estimates',
    method: 'GET',
    data: params
  });
};

// 获取估价详情
export const getEstimateDetail = (estimateId) => {
  return request({
    url: `/estimates/${estimateId}`,
    method: 'GET'
  });
};

// 创建估价
export const createEstimate = (data) => {
  return request({
    url: '/estimates',
    method: 'POST',
    data
  });
}; 