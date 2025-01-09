import { formatTimestamp } from '../../utils/date';

Page({
  data: {
    activeTab: 0,
    tabs: [
      { name: '进行中', value: 'processing' },
      { name: '已完成', value: 'completed' },
      { name: '全部', value: 'all' }
    ],
    isRefreshing: false,
    hasDriverPermission: false,
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
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `http://49.234.42.166:3000/api/orders?status=${status}`,
          method: 'GET',
          header: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzdhN2QxNDM5NmMwNjI5N2ZiMjA4ZDMiLCJyb2xlSWQiOiI2NzYyYzE1YjZiMjI4ZjMzMmQxMjAyMzEiLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzM2MDg2OTk3LCJleHAiOjE3Mzg2Nzg5OTd9.P4l_5Fj20k-DyR1fbQiuiWi8LGNnz6x4Duwi7qmVGmw'
          },
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res.data);
            } else {
              reject(new Error(res.data.message || '获取订单列表失败'));
            }
          },
          fail: reject
        });
      });

      // 更新订单列表
      this.setData({
        orders: res.items.map(order => ({
          ...order,
          pickupSiteName: order.pickupSiteName,  // 字段名适配
          deliverySiteName: order.deliverySiteName,  // 字段名适配
          createTime: order.createTime,  // 确保使用createTime作为接单日期
          createTimeText: this.getCreateTime(order.createTime)  // 预先格式化时间
        }))
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
    // 初始加载进行中的订单
    this.loadOrders('processing');
    this.checkPermission();
    this.loadOrderCounts();
  },

  onShow() {
    // 每次显示页面时刷新当前 tab 的数据
    const status = this.data.tabs[this.data.activeTab].value;
    this.loadOrders(status);
  },

  // 检查权限
  async checkPermission() {
    try {
      // TODO: 调用权限检查接口
      // const res = await permissionService.checkPermission('viewDriver');
      // this.setData({ hasDriverPermission: res.hasPermission });
      
      // 临时模拟权限检查
      this.setData({ hasDriverPermission: false });
    } catch (error) {
      console.error('权限检查失败:', error);
      this.setData({ hasDriverPermission: false });
    }
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
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'http://49.234.42.166:3000/api/orders/statistics/count',
          method: 'GET',
          header: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzdhN2QxNDM5NmMwNjI5N2ZiMjA4ZDMiLCJyb2xlSWQiOiI2NzYyYzE1YjZiMjI4ZjMzMmQxMjAyMzEiLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzM2MDg2OTk3LCJleHAiOjE3Mzg2Nzg5OTd9.P4l_5Fj20k-DyR1fbQiuiWi8LGNnz6x4Duwi7qmVGmw'
          },
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res.data);
            } else {
              reject(new Error(res.data.message || '获取订单数量统计失败'));
            }
          },
          fail: reject
        });
      });
      
      this.setData({ orderCounts: res });
    } catch (error) {
      console.error('加载订单数量统计失败:', error);
    }
  }
}); 