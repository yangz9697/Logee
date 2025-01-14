import { getSites, deleteSite } from '../../services/sites';
import Dialog from '@vant/weapp/dialog/dialog';

Page({
  data: {
    sites: [],
    loading: false
  },

  onLoad() {
    this.loadSites();
  },

  onShow() {
    this.loadSites();
  },

  async loadSites() {
    try {
      this.setData({ loading: true });
      const sites = await getSites();
      this.setData({ sites });
    } catch (error) {
      console.error('加载站点列表失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  onAddSite() {
    wx.navigateTo({
      url: '/pages/sites/edit'
    });
  },

  onEditSite(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/sites/edit?id=${id}`
    });
  },

  onDeleteSite(e) {
    const { id, name } = e.currentTarget.dataset.site;
    Dialog.confirm({
      title: '确认删除',
      message: `确定要删除站点"${name}"吗？`,
    }).then(async () => {
      try {
        wx.showLoading({ title: '删除中...' });
        await deleteSite(id);
        wx.showToast({ title: '删除成功' });
        this.loadSites();
      } catch (error) {
        console.error('删除站点失败:', error);
        wx.showToast({
          title: error.message || '删除失败',
          icon: 'none'
        });
      } finally {
        wx.hideLoading();
      }
    }).catch(() => {
      // 点击取消，不做任何操作
    });
  }
}); 