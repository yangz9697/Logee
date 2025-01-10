import { register } from '../../services/auth';

Page({
  data: {
    username: '',
    password: '',
    confirmPassword: ''
  },

  onUsernameChange(e) {
    this.setData({ username: e.detail });
  },

  onPasswordChange(e) {
    this.setData({ password: e.detail });
  },

  onConfirmPasswordChange(e) {
    this.setData({ confirmPassword: e.detail });
  },

  async onRegister() {
    try {
      if (!this.data.username || !this.data.password || !this.data.confirmPassword) {
        wx.showToast({
          title: '请填写完整信息',
          icon: 'none'
        });
        return;
      }

      if (this.data.password !== this.data.confirmPassword) {
        wx.showToast({
          title: '两次密码不一致',
          icon: 'none'
        });
        return;
      }

      const res = await register({
        username: this.data.username,
        password: this.data.password
      });

      // 保存token和用户信息
      wx.setStorageSync('token', res.token);
      wx.setStorageSync('userInfo', {
        username: res.user.username,
        roleName: res.user.role?.displayName || ''
      });

      wx.showToast({
        title: '注册成功',
        icon: 'success'
      });

      // 直接跳转到列表页
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/orders/index'
        });
      }, 1500);
    } catch (error) {
      console.error('注册失败:', error);
      wx.showToast({
        title: error.message || '注册失败',
        icon: 'none'
      });
    }
  }
}); 