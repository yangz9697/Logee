import request from './request';

// 获取站点列表
export function getSites() {
  return request({
    url: '/sites',
    method: 'GET'
  });
}

// 获取单个站点详情
export function getSite(id) {
  return request({
    url: `/sites/${id}`,
    method: 'GET'
  });
}

// 创建站点
export function createSite(data) {
  return request({
    url: '/sites',
    method: 'POST',
    data
  });
}

// 更新站点
export function updateSite(id, data) {
  return request({
    url: `/sites/${id}`,
    method: 'PUT',
    data
  });
}

// 删除站点
export function deleteSite(id) {
  return request({
    url: `/sites/${id}`,
    method: 'DELETE'
  });
} 