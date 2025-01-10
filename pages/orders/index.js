import { formatTimestamp } from '../../utils/date';
import { getOrders, getOrderStatistics } from '../../services/orders';

Page({
  data: {
    activeTab: 0,
    tabs: [
      { name: '进行中', value: 'processing' },
      { name: '已完成', value: 'completed' },
      { name: '全部', value: 'all' }
    ],
    isRefreshing: false,
    isAdmin: false,
    orders: [],
    orderCounts: {
      processing: 0,
      completed: 0,
      total: 0
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    try {
      this.setData({ isRefreshing: true });
      // 根据当前 tab 重新加载数据
      const status = this.data.tabs[this.data.activeTab].value;
      // 同时刷新订单列表和订单数量
      await Promise.all([
        this.loadOrders(status),
        this.loadOrderCounts()
      ]);
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

  // 加载订单数据
  async loadOrders(status) {
    try {
      this.setData({ isLoading: true });
      const res = await getOrders({ status });
      console.log('加载订单数据:', res);
      
      // 处理订单数据，添加格式化的时间
      const orders = res.map(order => ({
        ...order,
        createTimeText: this.getCreateTime(order.createTime)
      }));
      
      this.setData({
        orders: orders,
        isLoading: false
      });
    } catch (error) {
      console.error('加载订单失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
      throw error;
    }
  },

  onTabChange(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ activeTab: index });
    // 切换 tab 时重新加载数据
    this.loadOrders(this.data.tabs[index].value);
  },

  onLoad() {
    // 从本地存储获取用户信息，判断是否是管理员
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({
      isAdmin: userInfo.roleName === '管理员'
    });

    // 初始加载进行中的订单
    this.loadOrders('processing');
    this.loadOrderCounts();
  },

  onShow() {
    // 每次显示页面时刷新当前 tab 的数据
    const status = this.data.tabs[this.data.activeTab].value;
    // 同时刷新订单列表和订单数量
    Promise.all([
      this.loadOrders(status),
      this.loadOrderCounts()
    ]).catch(error => {
      console.error('刷新数据失败:', error);
    });
  },

  onOrderClick(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/orders/detail?id=${id}`
    });
  },

  onAddOrder() {
    wx.navigateTo({
      url: '/pages/orders/add'
    });
  },

  getCreateTime(timestamp) {
    if (!timestamp) return '';
    // 如果时间戳是13位的毫秒级，不需要转换
    // 如果是10位的秒级时间戳，需要转换为毫秒级
    const msTimestamp = String(timestamp).length === 10 ? timestamp * 1000 : timestamp;
    return formatTimestamp(msTimestamp, 'YYYY-MM-DD HH:mm');
  },

  // 加载订单数量统计
  async loadOrderCounts() {
    try {
      const res = await getOrderStatistics();
      
      this.setData({ orderCounts: res });
    } catch (error) {
      console.error('加载订单数量统计失败:', error);
    }
  }
}); 