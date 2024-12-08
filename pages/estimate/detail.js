const cozeService = require('../../services/coze');
const amapService = require('../../services/amap');
const { MOCK_RESPONSE } = require('../../constants/index');

Page({
  data: {
    origin: null,
    destination: null,
    imagePath: '',
    ocrText: '',  // 存储OCR结果
    loadingAddress: '',
    unloadingAddress: '',
    pickupDistance: '',
    deliveryDistance: '',
    pickupPrice: 0,
    deliveryPrice: 0,
    transitPrice: 100,
    totalPrice: 0,
    // 货物信息
    cargoName: '',
    packageType: '',
    volume: '',
    weight: 5,
    truckType: '',
    remark: ''
  },

  onLoad() {
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('estimateData', async (data) => {
      this.setData({
        origin: data.origin,
        destination: data.destination,
        imagePath: data.imagePath,
        ocrText: data.ocrText
      });

      // 直接开始解析地址
      await this.parseAddresses();
    });
  },

  // 解析地址
  async parseAddresses() {
    try {
      wx.showLoading({ title: '正在解析地址...' });
      
      // 调用Coze解析地址
      const result = await cozeService.parseText(this.data.ocrText);
      
      // 获取地址经纬度和距离
      await this.getAccurateLocations(result.loadingPlace, result.unloadingPlace);

    } catch (error) {
      console.error('解析地址失败:', error);
      wx.showToast({
        title: error.message || '解析失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  async getAccurateLocations(loadingAddress, unloadingAddress) {
    try {
      const loadingLocation = await amapService.getLocationByAddress(loadingAddress);
      const unloadingLocation = await amapService.getLocationByAddress(unloadingAddress);

      // 计算距离
      const pickupDistance = await amapService.calculateRouteDistance(
        { longitude: this.data.origin.lng, latitude: this.data.origin.lat },
        loadingLocation
      );

      const deliveryDistance = await amapService.calculateRouteDistance(
        { longitude: this.data.destination.lng, latitude: this.data.destination.lat },
        unloadingLocation
      );

      // 更新页面数据
      this.updatePageData({
        loadingAddress,
        unloadingAddress,
        loadingLocation,
        unloadingLocation,
        pickupDistance: `${pickupDistance}公里`,
        deliveryDistance: `${deliveryDistance}公里`
      });

    } catch (error) {
      throw new Error(`获取位置信息失败: ${error.message}`);
    }
  },

  updatePageData(data) {
    this.setData({
      ...MOCK_RESPONSE,  // 使用mock数据填充货物信息
      loadingAddress: data.loadingAddress,
      unloadingAddress: data.unloadingAddress,
      pickupDistance: data.pickupDistance,
      deliveryDistance: data.deliveryDistance,
      loadingLocation: data.loadingLocation,
      unloadingLocation: data.unloadingLocation
    }, () => {
      this.calculateTotalPrice();
    });
  },

  calculateTotalPrice() {
    const transitTotal = this.data.transitPrice * this.data.weight;
    const total = this.data.pickupPrice + this.data.deliveryPrice + transitTotal;
    
    this.setData({
      totalPrice: total.toFixed(2)
    });
  },

  // 增加干线价格
  increasePrice() {
    const newPrice = this.data.transitPrice + 10;
    this.setData({
      transitPrice: newPrice
    });
    this.calculateTotalPrice();
  },

  // 减少干线价格
  decreasePrice() {
    const newPrice = Math.max(0, this.data.transitPrice - 10);
    this.setData({
      transitPrice: newPrice
    });
    this.calculateTotalPrice();
  },

  // 显示提货路线
  showPickupRoute() {
    wx.navigateTo({
      url: `/pages/estimate/map?type=pickup&start=${this.data.origin.name}&end=${this.data.loadingAddress}&startLat=${this.data.origin.lat}&startLng=${this.data.origin.lng}&endLat=${this.data.loadingLocation.latitude}&endLng=${this.data.loadingLocation.longitude}`
    });
  },

  // 显示送货路线
  showDeliveryRoute() {
    wx.navigateTo({
      url: `/pages/estimate/map?type=delivery&start=${this.data.destination.name}&end=${this.data.unloadingAddress}&startLat=${this.data.destination.lat}&startLng=${this.data.destination.lng}&endLat=${this.data.unloadingLocation.latitude}&endLng=${this.data.unloadingLocation.longitude}`
    });
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  }
}); 