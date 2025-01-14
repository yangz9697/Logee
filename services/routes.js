import request from './request';

// 获取线路列表
export const getRoutes = () => {
  return request({
    url: '/lines',
    method: 'GET'
  });
};

// 获取线路详情
export const getRouteById = (id) => {
  return request({
    url: `/routes/${id}`,
    method: 'GET'
  });
};

// 创建线路
export const createRoute = (data) => {
  return request({
    url: '/lines',
    method: 'POST',
    data
  });
};

// 更新线路
export const updateRoute = (id, data) => {
  return request({
    url: `/routes/${id}`,
    method: 'PUT',
    data
  });
};

// 删除线路
export const deleteRoute = (id) => {
  return request({
    url: `/lines/${id}`,
    method: 'DELETE'
  });
};

// 更新线路价格和仓位
export const updateLinePrice = (id, data) => {
  return request({
    url: `/lines/${id}`,
    method: 'PATCH',
    data
  });
};

// 获取线路仓位统计
export const getLinesCapacity = () => {
  return request({
    url: '/lines/capacity',
    method: 'GET'
  });
}; 