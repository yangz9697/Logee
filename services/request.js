// 用于防止多次重定向
let isRedirecting = false;

// 基础请求函数
const request = (options) => {
  const { url, method = 'GET', data, params } = options;
  // 处理 GET 请求的查询参数
  let finalUrl = url;
  if (params) {
    const queryString = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== '')
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    if (queryString) {
      finalUrl = `${url}?${queryString}`;
    }
  }

  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'gateway',
      data: {
        url: finalUrl,
        method,
        data,
        headers: {
          ...(wx.getStorageSync('token') ? { 'Authorization': `Bearer ${wx.getStorageSync('token')}` } : {}),
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

          // 判断是否在登录页面
          const pages = getCurrentPages();
          const currentPage = pages[pages.length - 1];
          if (currentPage && currentPage.route === 'pages/login/index') {
            // 在登录页面直接返回错误信息
            reject(new Error(message || '用户名或密码错误'));
            isRedirecting = false;
            return;
          }

          console.log('未登录或登录已过期');
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
                title: '请重新登录',
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