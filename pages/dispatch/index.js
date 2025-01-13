const { formatTimestamp } = require('../../utils/date');
const { getDispatchList } = require('../../services/dispatch');

Page({
  data: {
    activeTab: 0,
    tabs: [
      { name: '进行中', value: 'processing' },
      { name: '全部', value: 'all' }
    ],
    isRefreshing: false,
    dispatchList: [],
  },

  onLoad() {
    this.loadDispatchList();
  },

  onShow() {
    this.loadDispatchList();
  },

  async onPullDownRefresh() {
    try {
      this.setData({ isRefreshing: true });
      await this.loadDispatchList();
    } catch (error) {
      console.error('刷新失败:', error);
      wx.showToast({
        title: '刷新失败',
        icon: 'none'
      });
    } finally {
      this.setData({ isRefreshing: false });
      wx.stopPullDownRefresh();
    }
  },

  onTabChange(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ activeTab: index }, () => {
      // 切换tab后重新加载数据
      this.loadDispatchList();
    });
  },

  async loadDispatchList() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const { activeTab } = this.data;
      const onlyInProgress = activeTab === 0; // 第一个tab是进行中
      
      const res = await getDispatchList({ onlyInProgress });
      console.log(res);
      // 转换数据格式
      const dispatchList = res.map(item => ({
        id: item.id,
        type: item.type === '提货' ? 'pickup' : 'delivery',
        status: item.status,
        statusName: item.status,
        cargoName: item.cargo.name,
        weight: item.cargo.weight,
        volume: item.cargo.volume,
        startArea: item.from,
        endArea: item.to,
        createTime: item.createTime,
        createTimeText: formatTimestamp(item.createTime),
        assigneeName: item.assigneeName
      }));

      this.setData({ dispatchList });
    } catch (error) {
      console.error('加载调度单列表失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  onDispatchClick(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/dispatch/detail?id=${id}`
    });
  }
}); 