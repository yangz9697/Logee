const MAX_BASE64_LENGTH = 150000;
const MAX_IMAGE_SIZE = 800;  // 最大边长

const ocrService = {
  // 使用canvas压缩图片
  async compressWithCanvas(tempFilePath) {
    try {
      console.log('开始canvas压缩:', tempFilePath);
      
      // 获取图片信息
      const imageInfo = await new Promise((resolve, reject) => {
        wx.getImageInfo({
          src: tempFilePath,
          success: resolve,
          fail: reject
        });
      });

      // 计算压缩后的尺寸
      let width = imageInfo.width;
      let height = imageInfo.height;
      
      if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
        if (width > height) {
          height = Math.round((height * MAX_IMAGE_SIZE) / width);
          width = MAX_IMAGE_SIZE;
        } else {
          width = Math.round((width * MAX_IMAGE_SIZE) / height);
          height = MAX_IMAGE_SIZE;
        }
      }

      // 创建离屏canvas
      const canvas = wx.createOffscreenCanvas({
        type: '2d',
        width,
        height
      });
      const ctx = canvas.getContext('2d');

      // 绘制图片
      const image = canvas.createImage();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = tempFilePath;
      });
      ctx.drawImage(image, 0, 0, width, height);

      // 转换为jpg并压缩
      let quality = 0.8;
      let result;
      let base64Length = Infinity;

      while (base64Length > MAX_BASE64_LENGTH && quality > 0.1) {
        result = await new Promise((resolve, reject) => {
          wx.canvasToTempFilePath({
            canvas,
            fileType: 'jpg',
            quality,
            success: (res) => {
              console.log(`Canvas压缩完成(quality=${quality}):`, res.tempFilePath);
              resolve(res.tempFilePath);
            },
            fail: reject
          });
        });

        // 检查base64长度
        try {
          const base64 = await this.fileToBase64(result);
          base64Length = base64.length;
          console.log(`当前base64长度: ${base64Length}, quality: ${quality}`);
          
          if (base64Length <= MAX_BASE64_LENGTH) {
            break;
          }
        } catch (error) {
          console.error('检查base64长度失败:', error);
        }

        // 降低质量继续尝试
        if (base64Length > MAX_BASE64_LENGTH * 2) {
          quality = Math.max(0.1, quality - 0.2);  // 如果太大，快速降低
        } else {
          quality = Math.max(0.1, quality - 0.1);  // 接近目标时，缓慢降低
        }
      }

      if (base64Length > MAX_BASE64_LENGTH) {
        throw new Error('无法将图片压缩到要求大小，请选择较小的图片');
      }

      return result;

    } catch (error) {
      console.error('Canvas压缩失败:', error);
      throw error;
    }
  },

  // 文件转Base64
  async fileToBase64(filePath) {
    try {
      console.log('开始转换base64:', filePath);
      const result = await new Promise((resolve, reject) => {
        wx.getFileSystemManager().readFile({
          filePath,
          encoding: 'base64',
          success: res => {
            console.log('base64转换成功，长度:', res.data.length);
            if (res.data.length > MAX_BASE64_LENGTH) {
              reject(new Error(`base64长度(${res.data.length})超过限制(${MAX_BASE64_LENGTH})`));
              return;
            }
            resolve(res.data);
          },
          fail: (error) => {
            console.error('base64转换失败:', error);
            reject(error);
          }
        });
      });
      return result;
    } catch (error) {
      console.error('base64转换失败:', error);
      throw error;
    }
  },

  // 识别图片
  async recognizeImage(tempFilePath) {
    try {
      console.log('开始识别图片:', tempFilePath);
      
      // 使用canvas压缩图片
      const compressedPath = await this.compressWithCanvas(tempFilePath);
      console.log('压缩后的图片路径:', compressedPath);
      
      // 转换为base64
      const base64Data = await this.fileToBase64(compressedPath);
      console.log('base64转换完成');
      
      const result = await new Promise((resolve, reject) => {
        console.log('调用OCR服务...');
        wx.serviceMarket.invokeService({
          service: 'wx79ac3de8be320b71',
          api: 'OcrAllInOne',
          data: {
            img_data: base64Data,
            data_type: 2,
            ocr_type: 8
          },
          success: (res) => {
            console.log('OCR服务调用成功:', res);
            resolve(res);
          },
          fail: (error) => {
            console.error('OCR服务调用失败:', error);
            if (error.errMsg?.includes('exceed max size')) {
              reject(new Error('图片太大，请选择较小的图片'));
            } else {
              reject(new Error('识别服务异常，请稍后重试'));
            }
          }
        });
      });

      return result;
    } catch (error) {
      console.error('图片处理失败:', error);
      throw error;
    }
  }
};

module.exports = ocrService; 