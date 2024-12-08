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

  // ... 其他方法保持不变
}); 