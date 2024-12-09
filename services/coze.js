const COZE_TOKEN = 'pat_lZ2zkZyuZuJjZiPm928zskjhRP22UKOtQtSRZPQhpW0fNH8i6mM7O4eSf0QplUnO';

const cozeService = {
  async parseText(text) {
    try {
      const response = await this.callWorkflow(text);
      console.log('Coze工作流原始响应:', response);
      return this.handleResponse(response);
    } catch (error) {
      console.error('Coze工作流调用失败:', error);
      throw error;
    }
  },

  callWorkflow(text) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://api.coze.cn/v1/workflow/run',
        method: 'POST',
        header: {
          'Authorization': `Bearer ${COZE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        data: {
          workflow_id: '7444842047746719779',
          parameters: {
            BOT_USER_INPUT: text
          }
        },
        success: (res) => {
          console.log('Coze API 响应:', res);
          resolve(res);
        },
        fail: (err) => {
          console.error('Coze API 调用失败:', err);
          reject(err);
        }
      });
    });
  },

  handleResponse(response) {
    if (response.statusCode === 200 && response.data.code === 0) {
      const result = JSON.parse(response.data.data);
      console.log('Coze 解析后的数据:', result);

      const { loadingPlace, unloadingPlace, price, weight, vehicleLength } = result;
      
      if (!loadingPlace || !unloadingPlace) {
        throw new Error('未能识别出装卸货地点');
      }

      return {
        loadingPlace,
        unloadingPlace,
        price: price || 0,
        weight: weight || 0, 
        vehicleLength: vehicleLength || 0
      };
    }
    throw new Error(response.data?.msg || '工作流调用失败');
  }
};

module.exports = cozeService; 