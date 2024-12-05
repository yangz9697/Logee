const AMapWX = require('../../libs/amap-wx.130.js').AMapWX;
const key = 'a31e0264e499ccaf681a3df1900b0fb9';
const myAmapFun = new AMapWX({ key });

Page({
  data: {
    longitude: 121.472644,
    latitude: 31.231706,
    scale: 11,
    markers: [],
    polyline: [],
    distance: '',
    duration: '',
    startAddress: '',
    endAddress: '',
    type: '',
    title: ''
  },

  onLoad(options) {
    const { type, start, end, startLat, startLng, endLat, endLng } = options;
    const title = type === 'pickup' ? '提货路线' : '送货路线';
    
    wx.setNavigationBarTitle({ title });
    
    this.setData({
      startAddress: start,
      endAddress: end,
      type,
      title,
      longitude: parseFloat(startLng),
      latitude: parseFloat(startLat),
      markers: [{
        id: 1,
        longitude: parseFloat(startLng),
        latitude: parseFloat(startLat),
        title: '起点',
        anchor: { x: .5, y: 1 },
        width: 20,
        height: 20
      }, {
        id: 2,
        longitude: parseFloat(endLng),
        latitude: parseFloat(endLat),
        title: '终点',
        anchor: { x: .5, y: 1 },
        width: 20,
        height: 20
      }]
    });

    // 规划路线
    this.getDrivingRoute({
      longitude: parseFloat(startLng),
      latitude: parseFloat(startLat)
    }, {
      longitude: parseFloat(endLng),
      latitude: parseFloat(endLat)
    });
  },

  getDrivingRoute(start, end) {
    myAmapFun.getDrivingRoute({
      origin: `${start.longitude},${start.latitude}`,
      destination: `${end.longitude},${end.latitude}`,
      success: (data) => {
        let points = [];
        if (data.paths && data.paths[0] && data.paths[0].steps) {
          const path = data.paths[0];
          path.steps.forEach(step => {
            const polyline = step.polyline.split(';');
            polyline.forEach(point => {
              const [longitude, latitude] = point.split(',');
              points.push({
                longitude: parseFloat(longitude),
                latitude: parseFloat(latitude)
              });
            });
          });
        }

        // 设置路线和距离信息
        this.setData({
          polyline: [{
            points,
            color: '#007AFF',
            width: 6,
            arrowLine: true
          }],
          distance: (data.paths[0].distance / 1000).toFixed(1),
          duration: Math.ceil(data.paths[0].duration / 60)
        });

        // 使用高德地图的路线规划结果自动调整视野
        if (points.length > 0) {
          const bounds = this.calculateBounds([start, end, ...points]);
          this.adjustMapView(bounds);
        }
      },
      fail: () => {
        wx.showToast({
          title: '路线规划失败',
          icon: 'none'
        });
      }
    });
  },

  calculateBounds(points) {
    let minLat = points[0].latitude;
    let maxLat = points[0].latitude;
    let minLng = points[0].longitude;
    let maxLng = points[0].longitude;

    points.forEach(point => {
      minLat = Math.min(minLat, point.latitude);
      maxLat = Math.max(maxLat, point.latitude);
      minLng = Math.min(minLng, point.longitude);
      maxLng = Math.max(maxLng, point.longitude);
    });

    return {
      southwest: { latitude: minLat, longitude: minLng },
      northeast: { latitude: maxLat, longitude: maxLng }
    };
  },

  adjustMapView(bounds) {
    const { southwest, northeast } = bounds;
    
    // 计算中心点
    const centerLatitude = (southwest.latitude + northeast.latitude) / 2;
    const centerLongitude = (southwest.longitude + northeast.longitude) / 2;
    
    // 计算距离来决定缩放级别
    const distance = this.calculateDistance(
        southwest.latitude,
        southwest.longitude,
        northeast.latitude,
        northeast.longitude
    );
    
    // 根据距离动态计算缩放级别
    let scale = this.getScaleByDistance(distance);

    // 更新地图视野
    this.setData({
        longitude: centerLongitude,
        latitude: centerLatitude,
        scale: scale
    });
  },

  // 计算两点之间的距离（单位：公里）
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 地球半径，单位公里
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  // 角度转弧度
  toRad(degree) {
    return degree * Math.PI / 180;
  },

  // 根据距离获取合适的缩放级别
  getScaleByDistance(distance) {
    // 距离与缩放级别的对应关系
    if (distance > 500) return 4;      // 超过500公里
    if (distance > 300) return 5;      // 300-500公里
    if (distance > 100) return 6;      // 100-300公里
    if (distance > 50) return 7;       // 50-100公里
    if (distance > 30) return 8;       // 30-50公里
    if (distance > 20) return 9;       // 20-30公里
    if (distance > 10) return 10;      // 10-20公里
    if (distance > 5) return 11;       // 5-10公里
    if (distance > 2) return 12;       // 2-5公里
    if (distance > 1) return 13;       // 1-2公里
    if (distance > 0.5) return 14;     // 500米-1公里
    return 15;                         // 小于500米
  }
}); 