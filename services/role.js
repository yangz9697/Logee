const roleService = {
  // 获取角色列表
  getRoles() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'http://49.234.42.166:3000/api/roles',
        method: 'GET',
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error('获取角色列表失败'));
          }
        },
        fail: (error) => {
          console.error('请求角色列表失败:', error);
          reject(error);
        }
      });
    });
  }
};

module.exports = roleService; 