const AMapWX = require('../../libs/amap-wx.130.js').AMapWX;
const key = 'a31e0264e499ccaf681a3df1900b0fb9';

Page({
  data: {
    markers: [],
    polyline: [],
    distance: '',
    duration: '',
    latitude: 0,
    longitude: 0,
    scale: 11,
    startAddress: '',
    endAddress: ''
  },

  onLoad(options) {
    const { type, start, end, startLat, startLng, endLat, endLng } = options;
    const title = type === 'pickup' ? '提货路线' : '送货路线';
    
    wx.setNavigationBarTitle({ title });

    // 设置标记点
    const markers = [{
      id: 0,
      latitude: parseFloat(startLat),
      longitude: parseFloat(startLng),
      width: 24,
      height: 34,
      callout: {
        content: start,
        color: '#333333',
        fontSize: 12,
        borderRadius: 4,
        padding: 8,
        display: 'ALWAYS',
        bgColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#eeeeee'
      },
      iconPath: '/images/marker_start.png',
      anchor: { x: 0.5, y: 1 }
    }, {
      id: 1,
      latitude: parseFloat(endLat),
      longitude: parseFloat(endLng),
      width: 24,
      height: 34,
      callout: {
        content: end,
        color: '#333333',
        fontSize: 12,
        borderRadius: 4,
        padding: 8,
        display: 'ALWAYS',
        bgColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#eeeeee'
      },
      iconPath: '/images/marker_end.png',
      anchor: { x: 0.5, y: 1 }
    }];

    // 计算中心点
    const centerLat = (parseFloat(startLat) + parseFloat(endLat)) / 2;
    const centerLng = (parseFloat(startLng) + parseFloat(endLng)) / 2;

    this.setData({
      markers,
      latitude: centerLat,
      longitude: centerLng,
      startAddress: start,
      endAddress: end
    });

    // 初始化高德地图并获取路线
    const amapFun = new AMapWX({ key });
    amapFun.getDrivingRoute({
      origin: `${startLng},${startLat}`,
      destination: `${endLng},${endLat}`,
      success: (data) => {
        const points = [];
        if (data.paths && data.paths[0] && data.paths[0].steps) {
          const steps = data.paths[0].steps;
          for (let i = 0; i < steps.length; i++) {
            const poLen = steps[i].polyline.split(';');
            for (let j = 0; j < poLen.length; j++) {
              points.push({
                longitude: parseFloat(poLen[j].split(',')[0]),
                latitude: parseFloat(poLen[j].split(',')[1])
              });
            }
          }
        }

        this.setData({
          polyline: [{
            points: points,
            color: "#0091ff",
            width: 6,
            arrowLine: true
          }],
          distance: (data.paths[0].distance / 1000).toFixed(1) + '公里',
          duration: Math.ceil(data.paths[0].duration / 60) + '分钟'
        });
      },
      fail: (error) => {
        console.error('获取路线失败:', error);
        wx.showToast({
          title: '获取路线失败',
          icon: 'none'
        });
      }
    });
  }
}); 