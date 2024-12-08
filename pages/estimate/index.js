const { origins } = require('../../constants/stations');
const ocrService = require('../../services/ocr');

Page({
  data: {
    tempImagePath: '',
    origins,
    destinations: [],
    startPointIndex: 0,
    endPointIndex: 0,
    selectedOrigin: origins[0],
    currentPrice: 0,
    canProceed: false,
    ocrSuccess: false,
    isLoading: false,
    ocrText: ''
  },

  onLoad() {
    // 初始化目的站点列表和价格
    const selectedOrigin = this.data.origins[0];
    this.setData({
      destinations: selectedOrigin.destinations,
      selectedOrigin,
      currentPrice: selectedOrigin.destinations[0].price
    });
    this.checkCanProceed();
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
          wx.showLoading({ title: '正在识别中...' });
          
          // 调用OCR识别
          const ocrResult = await ocrService.recognizeImage(tempFilePath);
          const textResult = ocrResult?.data?.ocr_comm_res?.items
            ?.map(item => item.text)
            .filter(Boolean)
            .join('\n');

          if (!textResult) {
            throw new Error('未能识别出文字');
          }

          // OCR识别成功，保存识别结果
          this.setData({
            ocrSuccess: true,
            canProceed: true,
            ocrText: textResult  // 保存OCR结果
          });
          
          wx.showToast({
            title: '识别成功',
            icon: 'success'
          });

        } catch (error) {
          console.error('OCR识别失败:', error);
          wx.showToast({
            title: error.message || '识别失败',
            icon: 'none'
          });
          
          this.setData({
            tempImagePath: '',
            ocrSuccess: false,
            canProceed: false,
            ocrText: ''  // 清空OCR结果
          });
        } finally {
          wx.hideLoading();
        }
      }
    });
  },

  // 选择始发站点
  onStartPointChange(e) {
    const index = parseInt(e.detail.value);
    const selectedOrigin = this.data.origins[index];
    
    this.setData({
      startPointIndex: index,
      selectedOrigin,
      destinations: selectedOrigin.destinations,
      endPointIndex: 0,
      currentPrice: selectedOrigin.destinations[0].price
    });
    this.checkCanProceed();
  },

  // 选择目的站点
  onEndPointChange(e) {
    const index = parseInt(e.detail.value);
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
  onNextStep() {
    if (!this.data.canProceed) return;

    const { selectedOrigin, destinations, endPointIndex, tempImagePath, ocrText } = this.data;
    const selectedDestination = destinations[endPointIndex];

    wx.navigateTo({
      url: '/pages/estimate/detail',
      success: (res) => {
        res.eventChannel.emit('estimateData', {
          origin: selectedOrigin,
          destination: selectedDestination,
          imagePath: tempImagePath,
          ocrText  // 传递OCR结果
        });
      }
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
  }
}); 