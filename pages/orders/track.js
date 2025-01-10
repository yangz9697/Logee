const { formatTimestamp } = require('../../utils/date');

Page({
  data: {
    waybillNo: '',
    tracks: [],
    loading: false
  },

  onLoad(options) {
    console.log('轨迹页面参数:', options);
    const { waybillNo } = options;
    if (!waybillNo) {
      wx.showToast({
        title: '运单号不能为空',
        icon: 'none'
      });
      return;
    }

    this.setData({ waybillNo });
    this.loadTrackInfo(waybillNo);
  },

  async loadTrackInfo(waybillNo) {
    console.log('开始加载轨迹, 运单号:', waybillNo);
    try {
      this.setData({ loading: true });
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://www.deppon.com/gwapi/trackService/eco/track/queryNewTrack',
          method: 'POST',
          header: {
            'ECO_TOKEN': 'A010901EBF1AD115CD9D9CB99C73CF6A',
            'Content-Type': 'application/json'
          },
          data: {
            waybillNumber: waybillNo
          },
          success: resolve,
          fail: reject
        });
      });

      if (res.data.status === 'success' && res.data.result?.tracks) {
        const tracks = res.data.result.tracks.map(track => ({
          ...track,
          timeText: formatTimestamp(track.operateTime)
        }));
        this.setData({ tracks });
      }
    } catch (error) {
      console.error('获取轨迹失败:', error);
      wx.showToast({
        title: '获取轨迹失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  }
}); 