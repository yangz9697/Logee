import { getSite, createSite, updateSite } from '../../services/sites';
import amapService from '../../services/amap';

Page({
  data: {
    id: null,
    site: {
      name: '',
      city: '',
      location: '',
      latitude: '',
      longitude: '',
      dayShiftContact: '',
      dayShiftPhone: '',
      nightShiftContact: '',
      nightShiftPhone: '',
      selfPickupPhone: ''
    },
    loading: false,
    showAddressPopup: false,
    searchValue: '',
    searchResults: []
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.loadSite();
    }
    wx.setNavigationBarTitle({
      title: options.id ? '编辑站点' : '新增站点'
    });
  },

  async loadSite() {
    if (!this.data.id) return;
    
    try {
      this.setData({ loading: true });
      const site = await getSite(this.data.id);
      this.setData({ site });
    } catch (error) {
      console.error('加载站点信息失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  onNameChange(e) {
    this.setData({
      'site.name': e.detail
    });
  },

  onCityChange(e) {
    this.setData({
      'site.city': e.detail
    });
  },

  onLocationChange(e) {
    this.setData({
      'site.location': e.detail
    });
  },

  onDayShiftContactChange(e) {
    this.setData({
      'site.dayShiftContact': e.detail
    });
  },

  onDayShiftPhoneChange(e) {
    this.setData({
      'site.dayShiftPhone': e.detail
    });
  },

  onNightShiftContactChange(e) {
    this.setData({
      'site.nightShiftContact': e.detail
    });
  },

  onNightShiftPhoneChange(e) {
    this.setData({
      'site.nightShiftPhone': e.detail
    });
  },

  onSelfPickupPhoneChange(e) {
    this.setData({
      'site.selfPickupPhone': e.detail
    });
  },

  showAddressSearch() {
    this.setData({ showAddressPopup: true });
  },

  onAddressPopupClose() {
    this.setData({ 
      showAddressPopup: false,
      searchValue: '',
      searchResults: []
    });
  },

  async onSearchAddress(e) {
    const value = e.detail;
    this.setData({ searchValue: value });
    
    if (!value) {
      this.setData({ searchResults: [] });
      return;
    }

    try {
      const results = await amapService.searchPOI(value);
      this.setData({ searchResults: results });
    } catch (error) {
      console.error('搜索地址失败:', error);
      wx.showToast({
        title: '搜索失败',
        icon: 'none'
      });
    }
  },

  onSelectAddress(e) {
    const { item } = e.currentTarget.dataset;
    this.setData({
      'site.location': item.district || item.name,
      'site.latitude': item.location.lat,
      'site.longitude': item.location.lng,
      showAddressPopup: false,
      searchValue: '',
      searchResults: []
    });
  },

  async handleSubmit(e) {
    const { site, id } = this.data;
    console.log(site, id);
    
    // 只验证必要字段
    if (!site.name || !site.city || !site.location || !site.latitude || !site.longitude) {
      wx.showToast({
        title: '请填写必要信息',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '保存中...' });
      
      // 构造提交的数据，格式化为API要求的格式
      const submitData = {
        name: site.name,
        city: site.city,
        location: site.location,
        lng: Number(site.longitude),  // 转换为数字
        lat: Number(site.latitude),   // 转换为数字
        // 组合联系人和电话
        dayReceiver: site.dayShiftContact && site.dayShiftPhone ? 
          `${site.dayShiftContact}/${site.dayShiftPhone}` : '',
        nightReceiver: site.nightShiftContact && site.nightShiftPhone ? 
          `${site.nightShiftContact}/${site.nightShiftPhone}` : '',
        selfPickup: site.selfPickupPhone ? 
          `自提/${site.selfPickupPhone}` : ''
      };

      if (id) {
        await updateSite(id, submitData);
      } else {
        await createSite(submitData);
      }

      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 2000,
        success: () => {
          setTimeout(() => {
            const pages = getCurrentPages();
            const prevPage = pages[pages.length - 2];
            prevPage.loadSites();
            wx.navigateBack();
          }, 2000);
        }
      });
    } catch (error) {
      console.error('保存站点失败:', error);
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  }
}); 