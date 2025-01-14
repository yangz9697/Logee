import { createRoute } from '../../services/routes';
import { deleteRoute } from '../../services/routes';
import { getSites } from '../../services/sites';

Page({
  data: {
    id: '',
    sites: [],
    showStartSitePopup: false,
    showEndSitePopup: false,
    startSiteName: '',
    endSiteName: '',
    form: {
      startSiteId: '',
      endSiteId: '',
      price: '',
      capacity: ''
    }
  },

  async onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
    }
    await this.loadSites();
  },

  async loadSites() {
    try {
      const sites = await getSites();
      this.setData({ sites });
    } catch (error) {
      console.error('加载站点列表失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    }
  },

  showStartSitePopup() {
    this.setData({ showStartSitePopup: true });
  },

  onStartSitePopupClose() {
    this.setData({ showStartSitePopup: false });
  },

  showEndSitePopup() {
    this.setData({ showEndSitePopup: true });
  },

  onEndSitePopupClose() {
    this.setData({ showEndSitePopup: false });
  },

  onStartSiteChange(e) {
    const { site } = e.currentTarget.dataset;
    this.setData({ 
      'form.startSiteId': site.id,
      startSiteName: site.name,
      showStartSitePopup: false
    });
  },

  onEndSiteChange(e) {
    const { site } = e.currentTarget.dataset;
    this.setData({ 
      'form.endSiteId': site.id,
      endSiteName: site.name,
      showEndSitePopup: false
    });
  },

  onPriceChange(e) {
    this.setData({ 'form.price': e.detail });
  },

  onCapacityChange(e) {
    this.setData({ 'form.capacity': e.detail });
  },

  validateForm() {
    const { form } = this.data;
    if (!form.startSiteId) {
      wx.showToast({
        title: '请选择始发站点',
        icon: 'none'
      });
      return false;
    }
    if (!form.endSiteId) {
      wx.showToast({
        title: '请选择到达站点',
        icon: 'none'
      });
      return false;
    }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) {
      wx.showToast({
        title: '请输入有效的运价',
        icon: 'none'
      });
      return false;
    }
    if (!form.capacity || isNaN(Number(form.capacity)) || Number(form.capacity) <= 0) {
      wx.showToast({
        title: '请输入有效的仓位',
        icon: 'none'
      });
      return false;
    }
    return true;
  },

  async onSubmit() {
    if (!this.validateForm()) return;

    try {
      wx.showLoading({ title: '保存中...' });
      
      const data = {
        startSiteId: this.data.form.startSiteId,
        endSiteId: this.data.form.endSiteId,
        price: Number(this.data.form.price),
        capacity: Number(this.data.form.capacity)
      };
      
      await createRoute(data);

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (error) {
      console.error('保存线路失败:', error);
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  async onDeleteRoute() {
    try {
      const res = await wx.showModal({
        title: '确认删除',
        content: '确定要删除该线路吗？',
        confirmText: '删除',
        confirmColor: '#ee0a24'
      });

      if (res.confirm) {
        wx.showLoading({ title: '删除中...' });
        await deleteRoute(this.data.id);

        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (error) {
      console.error('删除线路失败:', error);
      wx.showToast({
        title: error.message || '删除失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  }
}); 