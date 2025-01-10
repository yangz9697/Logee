// 用于防止多次重定向
let isRedirecting = false;

// 基础请求函数
const request = async (options) => {
  const token = wx.getStorageSync('token');

  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'gateway',
      data: {
        url: options.url,
        method: options.method || 'GET',
        data: options.data,
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...options.header
        }
      },
      success: (res) => {
        const { code, result, message } = res.result;
        // 处理token过期
        if (code === 401) {
          // 如果已经在重定向中，直接返回
          if (isRedirecting) {
            return;
          }
          isRedirecting = true;

          console.log('Token过期');
          Promise.all([
            new Promise(resolve => {
              wx.clearStorage({
                success: () => {
                  console.log('存储已清除');
                  resolve();
                }
              });
            }),
            new Promise(resolve => {
              wx.showToast({
                title: '登录已过期，请重新登录',
                icon: 'none',
                duration: 2000,
                success: resolve
              });
            })
          ]).then(() => {
            setTimeout(() => {
              console.log('跳转登录页');
              wx.redirectTo({
                url: '/pages/login/index'
              });
              // 重置重定向标记
              setTimeout(() => {
                isRedirecting = false;
              }, 1500);
            }, 1000);
          });
          return;
        }

        // 处理成功响应
        if (code === 200) {
          resolve(result);
        } else {
          reject(new Error(message || `请求失败(${code})`));
        }
      },
      fail: (error) => {
        console.log('请求失败:', error);
        reject(error);
      }
    });
  });
};

export default request; 