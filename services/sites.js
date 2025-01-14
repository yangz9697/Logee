import request from './request';

// 获取站点和目的地数据
export const getSiteDestinations = () => {
  return request({
    url: '/site-destinations',
    method: 'GET'
  });
};

// 获取站点列表
export const getSites = () => {
  return request({
    url: '/sites',
    method: 'GET'
  });
};

// 获取站点详情
export const getSiteById = (id) => {
  return request({
    url: `/sites/${id}`,
    method: 'GET'
  });
};

// 创建站点
export const createSite = (data) => {
  return request({
    url: '/sites',
    method: 'POST',
    data
  });
};

// 更新站点
export const updateSite = (id, data) => {
  return request({
    url: `/sites/${id}`,
    method: 'PUT',
    data
  });
};

// 删除站点
export const deleteSite = (id) => {
  return request({
    url: `/sites/${id}`,
    method: 'DELETE'
  });
}; 