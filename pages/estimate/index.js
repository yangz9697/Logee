const { origins, xianLines } = require('../../constants/stations');
const ocrService = require('../../services/ocr');
const cozeService = require('../../services/coze');
const amapService = require('../../services/amap');
const roleService = require('../../services/role');
import Toast from '@vant/weapp/toast/toast';
import { createEstimate } from '../../services/estimate';

Page({
  data: {
    tempImagePath: '',
    origins: origins,
    xianLines: xianLines,
    destinations: [],
    startPointIndex: 0,
    endPointIndex: 0,
    selectedOrigin: origins[0],
    currentPrice: 0,
    canProceed: false,
    ocrSuccess: false,
    isLoading: false,
    ocrText: '',
    isExpanded: false,
    loadingAddress: '',
    unloadingAddress: '',
    loadingSuggestions: [],
    unloadingSuggestions: [],
    loadingLocation: null,
    unloadingLocation: null,
    showAddressSelection: false,
    analysisResult: null,
    roles: [],
    loadingFocus: false,
    unloadingFocus: false,
    mode: 'all',  // 'all' 或 'xian'
    currentLines: origins
  },

  async onLoad() {
    // 初始化目的站点列表和价格
    const selectedOrigin = this.data.origins[0];
    this.setData({
      destinations: selectedOrigin.destinations,
      selectedOrigin,
      currentPrice: selectedOrigin.destinations[0].price
    });
    this.checkCanProceed();

    // 获取角色列表
    // try {
    //   const roles = await roleService.getRoles();
    //   console.log('获取到的角色列表:', roles);
    //   this.setData({ roles });
    // } catch (error) {
    //   console.error('获取角色列表失败:', error);
    //   Toast.fail('获取角色列表失败');
    // }
  },

  // 切换展开/收起
  toggleExpand() {
    this.setData({
      isExpanded: !this.data.isExpanded
    });
  },

  // 选择图片
  async chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          tempImagePath: tempFilePath,
          ocrSuccess: false,
          canProceed: false
        });
        
        // 开始OCR识别
        try {
          Toast.loading({
            message: '正在识别中...',
            forbidClick: true,
            duration: 0
          });
          
          // 调用OCR识别
          const ocrResult = await ocrService.recognizeImage(tempFilePath);
          const textResult = ocrResult?.data?.ocr_comm_res?.items
            ?.map(item => item.text)
            .filter(Boolean)
            .join(' ');

          if (!textResult) {
            throw new Error('未能识别出字');
          }

          // OCR识别成功，保存识别结果
          this.setData({
            ocrSuccess: true,
            canProceed: true,
            ocrText: textResult.replace(/\s+/g, ' ').trim()
          });
          
          Toast.success('识别成功');

        } catch (error) {
          console.error('OCR识别失败:', error);
          Toast.fail(error.message || '识别失败');
          
          this.setData({
            tempImagePath: '',
            ocrSuccess: false,
            canProceed: false,
            ocrText: ''
          });
        } finally {
          Toast.clear();
        }
      }
    });
  },

  // 恢复 radio 相关方法
  onStartPointChange(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    const selectedOrigin = this.data.currentLines[index];
    
    this.setData({
      startPointIndex: index,
      selectedOrigin,
      destinations: this.data.mode === 'all' ? selectedOrigin.destinations : [selectedOrigin.destination[0]],
      endPointIndex: 0,
      currentPrice: this.data.mode === 'all' ? selectedOrigin.destinations[0].price : selectedOrigin.destination[0].price
    });
    this.checkCanProceed();
  },
  
  onEndPointChange(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    const selectedDestination = this.data.destinations[index];
    
    this.setData({
      endPointIndex: index,
      currentPrice: selectedDestination.price
    });
    this.checkCanProceed();
  },

  // 输入运费
  onFeeInput(e) {
    this.setData({
      totalFee: e.detail.value
    });
    this.checkCanProceed();
  },

  // 检查是否可以进行下一步
  checkCanProceed() {
    const { tempImagePath, ocrSuccess } = this.data;
    const canProceed = !!tempImagePath && ocrSuccess;
    this.setData({ canProceed });
  },

  // 下一步
  async onNextStep() {
    try {
      this.setData({ isLoading: true });
      
      const estimateData = {
        origin: this.data.currentLines[this.data.startPointIndex],
        destination: this.data.destinations[this.data.endPointIndex]
      };

      const res = await createEstimate(estimateData);

      wx.navigateTo({
        url: `/pages/estimate/detail?id=${res.id}`
      });
    } catch (error) {
      console.error('数据分析失败:', error);
      wx.showToast({
        title: error.message || '分析失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 跳转到详情页
  navigateToDetail(loadingLocation, unloadingLocation, result) {
    const { selectedOrigin, destinations, endPointIndex, tempImagePath, ocrText } = this.data;
    const selectedDestination = destinations[endPointIndex];

    wx.navigateTo({
      url: `/pages/estimate/detail?data=${encodeURIComponent(JSON.stringify({
        origin: selectedOrigin,
        destination: selectedDestination,
        imagePath: tempImagePath,
        ocrText,
        loadingAddress: loadingLocation.name,
        unloadingAddress: unloadingLocation.name,
        loadingLocation,
        unloadingLocation,
        totalQuote: result.price,
        weight: result.weight,
        transitPrice: this.data.currentPrice,
        vehicleLength: result.vehicleLength
      }))}`,
    });
  },

  // 添加统一的错误处理方法
  handleError(error, title = '操作失败') {
    console.error(title, error);
    wx.showToast({
      title: error.message || title,
      icon: 'none'
    });
  },

  onShow() {
    // 从详情页返回时，清空图片和识别状态
    this.setData({
      tempImagePath: '',
      ocrSuccess: false,
      canProceed: false
    });
  },

  // 装货地址输入
  onLoadingAddressInput(e) {
    const address = e.detail.value;
    this.setData({ 
      loadingAddress: address,
      loadingFocus: true
    });
    if (address) {
      this.searchAddress(address, 'loading');
    } else {
      this.setData({ loadingSuggestions: [] });
    }
  },

  // 卸货地址输入
  onUnloadingAddressInput(e) {
    const address = e.detail.value;
    this.setData({ 
      unloadingAddress: address,
      unloadingFocus: true 
    });
    if (address) {
      this.searchAddress(address, 'unloading');
    } else {
      this.setData({ unloadingSuggestions: [] });
    }
  },

  // 搜索地址
  async searchAddress(keyword, type) {
    try {
      const suggestions = await amapService.searchPOI(keyword);
      this.setData({
        [`${type}Suggestions`]: suggestions
      });
    } catch (error) {
      console.error('搜索地址失败:', error);
      this.setData({
        [`${type}Suggestions`]: []
      });
    }
  },

  // 选择装货地址
  selectLoadingAddress(e) {
    const suggestion = e.currentTarget.dataset.suggestion;
    this.setData({
      loadingAddress: suggestion.name,
      loadingSuggestions: [],
      loadingFocus: false,
      loadingLocation: {
        latitude: suggestion.location.lat,
        longitude: suggestion.location.lng
      }
    }, () => {
      this.checkCanProceed();
      this.tryNavigateToDetail();
    });
  },

  // 选择卸货地址
  selectUnloadingAddress(e) {
    const suggestion = e.currentTarget.dataset.suggestion;
    this.setData({
      unloadingAddress: suggestion.name,
      unloadingSuggestions: [],
      unloadingFocus: false,
      unloadingLocation: {
        latitude: suggestion.location.lat,
        longitude: suggestion.location.lng
      }
    }, () => {
      this.checkCanProceed();
      this.tryNavigateToDetail();
    });
  },

  // 尝试跳转到详情页
  tryNavigateToDetail() {
    const { loadingLocation, unloadingLocation, analysisResult } = this.data;
    if (loadingLocation && unloadingLocation && analysisResult) {
      this.navigateToDetail(loadingLocation, unloadingLocation, analysisResult);
    }
  },

  // 防止触摸建议项时输入框失焦
  preventBlur() {
    return;
  },

  // 切换模式
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    const currentLines = mode === 'all' ? this.data.origins : this.data.xianLines;
    const selectedOrigin = currentLines[0];
    
    this.setData({
      mode,
      currentLines,
      startPointIndex: 0,
      selectedOrigin,
      destinations: mode === 'all' ? selectedOrigin.destinations : [selectedOrigin.destination[0]],
      endPointIndex: 0,
      currentPrice: mode === 'all' ? selectedOrigin.destinations[0].price : selectedOrigin.destination[0].price
    });
  },

  async loadDestinations(startSiteId) {
    try {
      const destinations = await getSiteDestinations(startSiteId);
      this.setData({
        destinations: destinations.map(item => ({
          ...item,
          lineId: item.id,
          id: item.site.id,
          name: item.site.name,
          price: item.price
        }))
      });
    } catch (error) {
      console.error('加载目的地列表失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    }
  },

  onDestinationChange(e) {
    const destination = this.data.destinations.find(
      item => item.id === e.detail
    );
    this.setData({
      selectedDestination: {
        id: destination.id,
        name: destination.name,
        price: destination.price,
        lineId: destination.lineId
      }
    });
  }
}); 