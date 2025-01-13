import { login } from '../../services/auth';

Page({
  data: {
    username: '',
    password: ''
  },

  onUsernameChange(e) {
    this.setData({ username: e.detail });
  },

  onPasswordChange(e) {
    this.setData({ password: e.detail });
  },

  async onLogin() {
    try {
      if (!this.data.username || !this.data.password) {
        wx.showToast({
          title: '请输入用户名和密码',
          icon: 'none'
        });
        return;
      }

      const res = await login({
        username: this.data.username,
        password: this.data.password
      });

      // 保存token和用户信息
      wx.setStorageSync('token', res.token);
      wx.setStorageSync('userInfo', {
        username: res.user.username,
        roleName: res.user.role?.displayName || '',
        phone: res.user.phone
      });

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      // 跳转到首页
      wx.reLaunch({
        url: '/pages/orders/index'
      });
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      });
    }
  },

  onRegister() {
    wx.navigateTo({
      url: '/pages/register/index'
    });
  }
}); 