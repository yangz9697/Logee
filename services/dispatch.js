import request from './request';

// 获取调度单列表
async function getDispatchList(params) {
  return request({
    url: '/dispatches',
    method: 'GET',
    data: params
  });
}

// 获取调度单详情
async function getDispatchDetail(id) {
  return request({
    url: `/dispatches/${id}`,
    method: 'GET'
  });
}

// 更新调度单状态
async function updateDispatchStatus(id, action) {
  return request({
    url: `/dispatches/${id}/status`,
    method: 'POST',
    data: { action }
  });
}

// 更新运输基本信息
export const updateTransportBasic = (dispatchId, data) => {
  return request({
    url: `/dispatches/${dispatchId}/transport/basic`,
    method: 'PATCH',
    data
  });
};

// 更新运输费用信息
export const updateTransportFee = (dispatchId, data) => {
  return request({
    url: `/dispatches/${dispatchId}/transport/fee`,
    method: 'PATCH',
    data
  });
};

module.exports = {
  getDispatchList,
  getDispatchDetail,
  updateDispatchStatus,
  updateTransportBasic,
  updateTransportFee
}; 