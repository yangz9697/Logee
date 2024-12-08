const amapService = require('../../services/amap');
const ocrService = require('../../services/ocr');
const cozeService = require('../../services/coze');
const { MOCK_RESPONSE, STATIONS } = require('../../constants/index.js');
const { getSystemInfo } = require('../../utils/location');

const mp = require('miniprogram-render');
const getBaseConfig = require('../base.js');
const config = require('../../config');

function init(window, document) {
  require('../../common/chunk-vendors.js')(window, document);
  require('../../common/routeplan.js')(window, document);
}

const baseConfig = getBaseConfig(mp, config, init);

Page({
  ...baseConfig.base,
  data: {
    pageId: '',
    bodyClass: '',
    bodyStyle: '',
    loadingText: '加载中...',
    pageStatus: 'loading',
    windowWidth: 375,
    windowHeight: 667,
    tempImagePath: '',
    hasImageInfo: false,
    selectedStartPoint: '',
    selectedEndPoint: '',
    stations: STATIONS,
    loadingAddress: '',
    startStation: '',
    pickupDistance: '',
    pickupPrice: '',
    pickupTruckInfo: '',
    loadingLocation: null,
    unloadingAddress: '',
    destinationStation: '',
    deliveryDistance: '',
    deliveryPrice: '',
    deliveryTruckInfo: '',
    unloadingLocation: null,
    cargoName: '',
    packageType: '',
    volume: '',
    remark: '',
    weight: 5,
    transitPrice: 100,
    totalPrice: 0,
    safeAreaTop: 0,
    safeAreaBottom: 0,
    ...baseConfig.base.data
  },

  onLoad(query) {
    if (baseConfig.base.onLoad) {
      baseConfig.base.onLoad.call(this, query);
    }
    const { safeAreaTop, safeAreaBottom } = getSystemInfo();
    this.setData({ 
      safeAreaTop, 
      safeAreaBottom,
      pageStatus: 'loaded'
    });
    this.initStationLocations();
  },

  onReady() {
    if (baseConfig.base.onReady) {
      baseConfig.base.onReady.call(this);
    }
  },

  // 验证站点选择
  validateStationSelection() {
    if (!this.data.selectedStartPoint || !this.data.selectedEndPoint) {
      wx.showToast({
        title: '请先选择站点',
        icon: 'none'
      });
      return false;
    }
    return true;
  },

  // 选择媒体
  chooseMedia() {
    return new Promise((resolve, reject) => {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          resolve({
            tempFilePath: res.tempFiles[0].tempFilePath
          });
        },
        fail: reject
      });
    });
  },

  // 处理图片
  async processImage(tempFilePath) {
    try {
      wx.showLoading({ title: '正在识别中...' });
      
      // 调用OCR识别
      const ocrResult = await ocrService.recognizeImage(tempFilePath);
      console.log('OCR识别结果:', ocrResult);
      
      // 提取文本
      const textResult = ocrResult?.data?.ocr_comm_res?.items
        ?.map(item => item.text)
        .filter(Boolean)
        .join('\n');

      if (!textResult) {
        throw new Error('未能识别出文字');
      }

      console.log('待解析的文本:', textResult);

      // 调用Coze解析
      const result = await cozeService.parseText(textResult);
      console.log('Coze解析结果:', result);

      if (!result?.loadingPlace || !result?.unloadingPlace) {
        throw new Error('未能正确解析地址信息');
      }

      // 获取地址经纬度和距离
      await this.getAccurateLocations(result.loadingPlace, result.unloadingPlace);

    } catch (error) {
      console.error('处理图片失败:', error);
      this.handleError(error);
    } finally {
      wx.hideLoading();
    }
  },

  // 获取精确位置信息
  async getAccurateLocations(loadingAddress, unloadingAddress) {
    try {
      // 获取装货地址经纬度
      const loadingLocation = await amapService.getLocationByAddress(loadingAddress);
      const unloadingLocation = await amapService.getLocationByAddress(unloadingAddress);

      // 获取选中的站点位置
      const startPoint = this.data.stations.startPoints[this.data.selectedStartPoint];
      const endPoint = this.data.stations.endPoints[this.data.selectedEndPoint];

      if (!startPoint || !endPoint) {
        throw new Error('站点位置信息未准备好');
      }

      // 计算距离
      const pickupDistance = await amapService.calculateRouteDistance(startPoint, loadingLocation);
      const deliveryDistance = await amapService.calculateRouteDistance(endPoint, unloadingLocation);

      // 更新页面数据
      this.updateImageInfo({
        loadingAddress,
        unloadingAddress,
        loadingLocation,
        unloadingLocation,
        pickupDistance: `${pickupDistance}公里`,
        deliveryDistance: `${deliveryDistance}公里`
      });

    } catch (error) {
      throw new Error(`获取位置信息��败: ${error.message}`);
    }
  },

  // 初始化站点位置
  async initStationLocations() {
    // 获取所有始发点位置
    for (const point of Object.keys(this.data.stations.startPoints)) {
      try {
        const location = await amapService.getLocationByAddress(point);
        this.setData({
          [`stations.startPoints.${point}`]: location
        });
      } catch (error) {
        console.error(`获取始发点 ${point} 位置失败:`, error);
      }
    }
    
    // 获取所有目标站点位置
    for (const point of Object.keys(this.data.stations.endPoints)) {
      try {
        const location = await amapService.getLocationByAddress(point);
        this.setData({
          [`stations.endPoints.${point}`]: location
        });
      } catch (error) {
        console.error(`获取目标站点 ${point} 位置失败:`, error);
      }
    }
  },

  // 错误处理
  handleError(error) {
    console.error('操作失败:', error);
    wx.showToast({
      title: error.message || '操作失败',
      icon: 'none'
    });
  },

  // 在 Page 对象中添加 chooseImage 方法
  chooseImage() {
    if (!this.validateStationSelection()) return;

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          tempImagePath: tempFilePath
        });
        
        this.processImage(tempFilePath);
      },
      fail: (err) => {
        this.handleError(new Error('选择图片失败'));
      }
    });
  },

  // 选择始发点
  selectStartPoint(e) {
    const point = e.currentTarget.dataset.point;
    const location = this.data.stations.startPoints[point];
    
    this.setData({
      selectedStartPoint: point,
      startStation: point,
      loadingLocation: location,
      hasImageInfo: false,
      tempImagePath: '',
      loadingAddress: '',
      unloadingAddress: ''
    });
  },

  // 选择目标站点
  selectEndPoint(e) {
    const point = e.currentTarget.dataset.point;
    const location = this.data.stations.endPoints[point];
    
    this.setData({
      selectedEndPoint: point,
      destinationStation: point,
      unloadingLocation: location,
      hasImageInfo: false,
      tempImagePath: '',
      loadingAddress: '',
      unloadingAddress: ''
    });
  },

  // 更新图片信息
  updateImageInfo(data) {
    this.setData({
      hasImageInfo: true,
      loadingAddress: data.loadingAddress || '',
      startStation: this.data.selectedStartPoint,
      unloadingAddress: data.unloadingAddress || '',
      destinationStation: this.data.selectedEndPoint,
      pickupDistance: data.pickupDistance || '',
      deliveryDistance: data.deliveryDistance || '',
      pickupPrice: MOCK_RESPONSE.pickupPrice,
      deliveryPrice: MOCK_RESPONSE.deliveryPrice,
      weight: MOCK_RESPONSE.weight,
      cargoName: MOCK_RESPONSE.cargoName,
      packageType: MOCK_RESPONSE.packageType,
      volume: MOCK_RESPONSE.volume,
      truckType: MOCK_RESPONSE.truckType,
      remark: MOCK_RESPONSE.remark,
      loadingLocation: data.loadingLocation || null,
      unloadingLocation: data.unloadingLocation || null
    }, () => {
      this.calculateTotalPrice();
    });
  },

  // 计算总价
  calculateTotalPrice() {
    const pickupPrice = this.data.pickupPrice;
    const deliveryPrice = this.data.deliveryPrice;
    const transitTotal = this.data.transitPrice * this.data.weight;
    const total = pickupPrice + deliveryPrice + transitTotal;
    
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
  }
});
