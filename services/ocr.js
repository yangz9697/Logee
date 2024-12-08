const ocrService = {
  // OCR识别
  async recognizeImage(filePath) {
    const base64 = await this.fileToBase64(filePath);
    return this.callOcrApi(base64);
  },

  // 文件转Base64
  fileToBase64(filePath) {
    return new Promise((resolve, reject) => {
      wx.getFileSystemManager().readFile({
        filePath,
        encoding: 'base64',
        success: res => resolve(res.data),
        fail: reject
      });
    });
  },

  // 调用OCR API
  callOcrApi(base64Data) {
    return new Promise((resolve, reject) => {
      wx.serviceMarket.invokeService({
        service: 'wx79ac3de8be320b71',
        api: 'OcrAllInOne',
        data: {
          img_data: base64Data,
          data_type: 2,
          ocr_type: 8
        },
        success: resolve,
        fail: reject
      });
    });
  }
};

module.exports = ocrService; 