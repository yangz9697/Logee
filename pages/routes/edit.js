import { updateLinePrice } from '../../services/routes';

Page({
  data: {
    id: '',
    startSiteName: '',
    endSiteName: '',
    form: {
      price: '',
      direction: ''
    }
  },

  onLoad(options) {
    const { id, startSiteName, endSiteName, price, direction } = options;
    this.setData({ 
      id,
      startSiteName,
      endSiteName,
      form: {
        price,
        direction: direction || ''
      }
    });
    wx.setNavigationBarTitle({
      title: '修改线路'
    });
  },

  onPriceChange(e) {
    this.setData({
      'form.price': e.detail
    });
  },

  onDirectionChange(e) {
    this.setData({
      'form.direction': e.detail
    });
  },

  async onSubmit() {
    const { id, form } = this.data;
    
    if (!form.price) {
      wx.showToast({
        title: '请输入运价',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '保存中...' });
      await updateLinePrice(id, {
        price: Number(form.price),
        direction: form.direction
      });

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      console.error('保存失败:', error);
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  }
}); 