import request from './request';

// 获取订单列表
export const getOrders = (params) => {
  return request({
    url: '/orders',
    method: 'GET',
    data: params
  });
};

// 获取订单详情
export const getOrderDetail = (orderId) => {
  return request({
    url: `/orders/${orderId}`,
    method: 'GET'
  });
};

// 更新订单基本信息
export const updateOrderBasic = (orderId, data) => {
  return request({
    url: `/orders/${orderId}/basic`,
    method: 'PATCH',
    data
  });
};

// 更新订单货物信息
export const updateOrderCargo = (orderId, data) => {
  return request({
    url: `/orders/${orderId}/cargo`,
    method: 'PATCH',
    data
  });
};

// 更新订单联系信息
export const updateOrderShipping = (orderId, data) => {
  return request({
    url: `/orders/${orderId}/shipping`,
    method: 'PATCH',
    data
  });
};

// 更新订单费用信息
export const updateOrderFees = (orderId, data) => {
  return request({
    url: `/orders/${orderId}/fees`,
    method: 'PATCH',
    data
  });
};

// 更新订单状态
export const updateOrderStatus = (orderId, data) => {
  return request({
    url: `/orders/${orderId}/status`,
    method: 'POST',
    data
  });
};

// 创建订单
export const createOrder = (data) => {
  return request({
    url: '/orders',
    method: 'POST',
    data
  });
};

// 获取订单统计数据
export const getOrderStatistics = () => {
  return request({
    url: '/orders/statistics/count',
    method: 'GET'
  });
}; 