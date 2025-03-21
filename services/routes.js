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

// 获取流向列表
export const getFlows = () => {
  return request({
    url: '/flows',
    method: 'GET'
  });
};

// 关注线路
export const followLine = (id) => {
  return request({
    url: `/routes/${id}/follow`,
    method: 'POST'
  });
};

// 取消关注
export const unfollowLine = (id) => {
  return request({
    url: `/routes/${id}/follow`,
    method: 'DELETE'
  });
};

// 更新线路状态（启用/禁用）
export const updateLineStatus = (id, data) => {
  return request({
    url: `/routes/${id}/status`,
    method: 'PUT',
    data
  });
}; 