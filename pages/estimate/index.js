const { origins } = require('../../constants/stations');
const ocrService = require('../../services/ocr');
const cozeService = require('../../services/coze');
import Toast from '@vant/weapp/toast/toast';

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
    ocrText: '',
    showStartPicker: false,
    showEndPicker: false
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
          
          Toast.success('识别成功');

        } catch (error) {
          console.error('OCR识别失败:', error);
          Toast.fail(error.message || '识别失败');
          
          this.setData({
            tempImagePath: '',
            ocrSuccess: false,
            canProceed: false,
            ocrText: ''  // 清空OCR结果
          });
        } finally {
          Toast.clear();
        }
      }
    });
  },

  // 恢复 radio 相关方法
  onStartPointChange(e) {
    const index = parseInt(e.detail);
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
  
  onEndPointChange(e) {
    const index = parseInt(e.detail);
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
    if (!this.data.canProceed) return;

    try {
      wx.showLoading({ title: '正在分析数据...' });

      // 使用现有的 callWorkflow 方法分析文本
      console.log('开始分析文本:', this.data.ocrText);
      const response = await cozeService.callWorkflow(this.data.ocrText);
      const result = await cozeService.handleResponse(response);

      // 跳转到详情页
      const { selectedOrigin, destinations, endPointIndex, tempImagePath, ocrText } = this.data;
      const selectedDestination = destinations[endPointIndex];

      // 将数据编码为URL参数
      wx.navigateTo({
        url: `/pages/estimate/detail?data=${encodeURIComponent(JSON.stringify({
          origin: selectedOrigin,
          destination: selectedDestination,
          imagePath: tempImagePath,
          ocrText,
          loadingAddress: result.loadingPlace,
          unloadingAddress: result.unloadingPlace,
          totalQuote: result.price,
          weight: result.weight,
          transitPrice: this.data.currentPrice,
          vehicleLength: result.vehicleLength
        }))}`,
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