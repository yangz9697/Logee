import { createRoute } from '../../services/routes';
import { deleteRoute } from '../../services/routes';
import { getSites } from '../../services/sites';
import { getLineDetail } from '../../services/routes';
import { updateLinePrice } from '../../services/routes';

Page({
  data: {
    id: '',
    startSiteId: '',
    endSiteId: '',
    route: {
      startSite: {},
      endSite: {}
    },
    form: {
      price: '',
      capacity: ''
    },
    loading: false,
    showStartSitePopup: false,
    showEndSitePopup: false,
    sites: []
  },

  onLoad(options) {
    const { id, startSiteId, endSiteId } = options;
    if (id) {
      this.setData({ 
        id,
        startSiteId,
        endSiteId
      });
      this.loadLineDetail();
    }
    this.loadSites();
  },

  async loadLineDetail() {
    try {
      this.setData({ loading: true });
      const line = await getLineDetail(this.data.id);
      this.setData({
        form: {
          price: line.price,
          capacity: line.capacity
        }
      });
    } catch (error) {
      console.error('加载线路详情失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  async onSubmit() {
    const { startSiteId, endSiteId, form } = this.data;
    console.log('提交数据:', { startSiteId, endSiteId, form });
    
    if (!startSiteId || !endSiteId || !form.price || !form.capacity) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '保存中...' });
      if (this.data.id) {
        await updateLinePrice(this.data.id, form);
      } else {
        const submitData = {
          startSiteId,
          endSiteId,
          price: Number(form.price),
          capacity: Number(form.capacity)
        };
        console.log('提交的数据:', submitData);
        await createRoute(submitData);
      }

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
  },

  showStartSitePopup() {
    this.setData({
      showStartSitePopup: true
    });
  },

  onStartSitePopupClose() {
    this.setData({
      showStartSitePopup: false
    });
  },

  onStartSiteSelect(e) {
    const { site } = e.currentTarget.dataset;
    console.log('选择的起始站点:', site);
    this.setData({
      'route.startSite': site,
      startSiteId: site.id || 'SITE012',
      showStartSitePopup: false
    });
  },

  showEndSitePopup() {
    this.setData({
      showEndSitePopup: true
    });
  },

  onEndSitePopupClose() {
    this.setData({
      showEndSitePopup: false
    });
  },

  onEndSiteSelect(e) {
    const { site } = e.currentTarget.dataset;
    console.log('选择的到达站点:', site);
    this.setData({
      'route.endSite': site,
      endSiteId: site.id || 'SITE012',
      showEndSitePopup: false
    });
  },

  onPriceChange(e) {
    this.setData({
      'form.price': e.detail
    });
  },

  onCapacityChange(e) {
    this.setData({
      'form.capacity': e.detail
    });
  },

  async loadSites() {
    try {
      const sites = await getSites();
      this.setData({ sites });
    } catch (error) {
      console.error('加载站点列表失败:', error);
      wx.showToast({
        title: error.message || '加载站点失败',
        icon: 'none'
      });
    }
  }
}); 