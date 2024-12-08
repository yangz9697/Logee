const AMapWX = require('../libs/amap-wx.130.js').AMapWX;
const key = 'a31e0264e499ccaf681a3df1900b0fb9';

const amapService = {
  amapFun: new AMapWX({ key }),

  // 获取位置信息
  getLocationByAddress(address) {
    return new Promise((resolve, reject) => {
      this.amapFun.getInputtips({
        keywords: address,
        location: '',
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
  }
};

module.exports = amapService; 