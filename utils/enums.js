// 加载枚举数据
export const loadEnums = async () => {
  try {
    const res = await new Promise((resolve, reject) => {
      wx.request({
        url: 'http://49.234.42.166:3000/api/enums',
        method: 'GET',
        header: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzdhN2QxNDM5NmMwNjI5N2ZiMjA4ZDMiLCJyb2xlSWQiOiI2NzYyYzE1YjZiMjI4ZjMzMmQxMjAyMzEiLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzM2MDg2OTk3LCJleHAiOjE3Mzg2Nzg5OTd9.P4l_5Fj20k-DyR1fbQiuiWi8LGNnz6x4Duwi7qmVGmw'
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`Request failed with status ${res.statusCode}`));
          }
        },
        fail: reject
      });
    });
    return res;
  } catch (error) {
    console.error('加载枚举数据失败:', error);
    return null;
  }
};

// 缓存的枚举数据
let enumsCache = null;

// 获取枚举数据
export const getEnums = async () => {
  if (!enumsCache) {
    enumsCache = await loadEnums();
  }
  return enumsCache;
}; 