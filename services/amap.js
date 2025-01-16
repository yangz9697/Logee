const AMapWX = require('../libs/amap-wx.130.js').AMapWX;
const key = 'a31e0264e499ccaf681a3df1900b0fb9';

const amapService = {
  amapFun: new AMapWX({ key }),

  // 搜索POI
  searchPOI(keyword) {
    return new Promise((resolve, reject) => {
      const amap = new AMapWX({ key });
      amap.getInputtips({
        keywords: keyword,
        city: '全国',
        location: '',
        citylimit: false,
        success: (res) => {
          // 转换返回的数据格式
          const results = res.tips
            .filter(tip => tip.name && tip.location)
            .map(tip => ({
              id: tip.id || String(Math.random()),
              name: tip.name,
              district: tip.district || tip.address || '',
              location: {
                lat: tip.location.split(',')[1],
                lng: tip.location.split(',')[0]
              }
            }));
          resolve(results);
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  // 获取位置信息
  getLocationByAddress(address) {
    return new Promise((resolve, reject) => {
      this.amapFun.getInputtips({
        keywords: address,
        success: (data) => {
          if (data?.tips?.[0]?.location) {
            const [longitude, latitude] = data.tips[0].location.split(',');
            resolve({
              address,
              longitude: parseFloat(longitude),
              latitude: parseFloat(latitude)
            });
          } else {
            reject(new Error(`无法获取 ${address} 的经纬度`));
          }
        },
        fail: reject
      });
    });
  },

  // 计算路线距离
  calculateRouteDistance(start, end) {
    if (!start?.longitude || !end?.longitude) {
      return Promise.reject(new Error('位置信息不完整'));
    }

    return new Promise((resolve, reject) => {
      this.amapFun.getDrivingRoute({
        origin: `${start.longitude},${start.latitude}`,
        destination: `${end.longitude},${end.latitude}`,
        success: (data) => {
          if (data.paths?.[0]?.distance) {
            resolve((data.paths[0].distance / 1000).toFixed(1));
          } else {
            reject(new Error('无法计算路线距离'));
          }
        },
        fail: reject
      });
    });
  },

  // 直接调用高德地图 API
  searchAddress({ keywords, city }) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://restapi.amap.com/v3/place/text',
        data: {
          key: 'YOUR_AMAP_KEY', // 替换为您的高德地图 key
          keywords,
          city,
          offset: 20,
          page: 1,
          extensions: 'all'
        },
        success: (res) => {
          if (res.data && res.data.pois) {
            const results = res.data.pois.map(item => ({
              id: item.id,
              name: item.name,
              district: item.address,
              address: item.address,
              latitude: item.location.split(',')[1],
              longitude: item.location.split(',')[0]
            }));
            resolve(results);
          } else {
            reject(new Error('搜索失败'));
          }
        },
        fail: reject
      });
    });
  }
};

module.exports = amapService; 