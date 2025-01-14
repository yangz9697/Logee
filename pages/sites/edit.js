import { getSites, getSiteById, createSite, updateSite } from '../../services/sites';
import amapService from '../../services/amap';

Page({
  data: {
    id: '',
    form: {
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
    showAddressPopup: false,
    searchValue: '',
    searchResults: [],
    searchTimer: null
  },

  async onLoad(options) {
    await this.loadSites();

    if (options.id) {
      this.setData({ id: options.id });
      this.loadSiteDetail(options.id);
    }
  },

  // 搜索地址
  onSearchAddress(e) {
    const value = e.detail;
    this.setData({ searchValue: value });

    // 防抖处理
    if (this.data.searchTimer) {
      clearTimeout(this.data.searchTimer);
    }

    if (!value) {
      this.setData({ searchResults: [] });
      return;
    }

    this.data.searchTimer = setTimeout(async () => {
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
    }, 500);
  },

  // 选择地址
  onSelectAddress(e) {
    const { item } = e.currentTarget.dataset;
    this.setData({
      'form.latitude': item.location.lat,
      'form.longitude': item.location.lng,
      showAddressPopup: false,
      searchValue: '',
      searchResults: []
    });
  },

  // 显示地址搜索弹窗
  showAddressSearch() {
    this.setData({ 
      showAddressPopup: true,
      searchValue: '',
      searchResults: []
    });
  },

  // 关闭地址搜索弹窗
  onAddressPopupClose() {
    this.setData({ showAddressPopup: false });
  },

  async loadSiteDetail(id) {
    try {
      wx.showLoading({ title: '加载中...' });
      const site = await getSiteById(id);
      // 解析联系人信息
      const [dayContact, dayPhone] = site.dayReceiver.split('/');
      const [nightContact, nightPhone] = site.nightReceiver.split('/');
      const [, selfPickupPhone] = site.selfPickup.split('/');

      this.setData({
        form: {
          name: site.name,
          location: site.location,
          city: site.city,
          latitude: site.lat,
          longitude: site.lng,
          dayShiftContact: dayContact,
          dayShiftPhone: dayPhone,
          nightShiftContact: nightContact,
          nightShiftPhone: nightPhone,
          selfPickupPhone: selfPickupPhone
        }
      });

    } catch (error) {
      console.error('加载站点详情失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 表单字段变化处理
  onNameChange(e) {
    this.setData({ 'form.name': e.detail });
  },

  onCityChange(e) {
    this.setData({ 'form.city': e.detail });
  },

  onLocationChange(e) {
    this.setData({ 'form.location': e.detail });
  },

  onDayShiftContactChange(e) {
    this.setData({ 'form.dayShiftContact': e.detail });
  },

  onDayShiftPhoneChange(e) {
    this.setData({ 'form.dayShiftPhone': e.detail });
  },

  onNightShiftContactChange(e) {
    this.setData({ 'form.nightShiftContact': e.detail });
  },

  onNightShiftPhoneChange(e) {
    this.setData({ 'form.nightShiftPhone': e.detail });
  },

  onSelfPickupPhoneChange(e) {
    this.setData({ 'form.selfPickupPhone': e.detail });
  },

  // 表单验证
  validateForm() {
    const { form } = this.data;
    if (!form.name) {
      wx.showToast({
        title: '请输入站点名称',
        icon: 'none'
      });
      return false;
    }
    if (!form.location || !form.city || !form.latitude || !form.longitude) {
      wx.showToast({
        title: '请选择站点地址',
        icon: 'none'
      });
      return false;
    }
    if (!form.dayShiftContact || !form.dayShiftPhone) {
      wx.showToast({
        title: '请输入白班联系人信息',
        icon: 'none'
      });
      return false;
    }
    if (!form.nightShiftContact || !form.nightShiftPhone) {
      wx.showToast({
        title: '请输入晚班联系人信息',
        icon: 'none'
      });
      return false;
    }
    if (!form.selfPickupPhone) {
      wx.showToast({
        title: '请输入自提联系电话',
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
      
      // 构造API所需的数据格式
      const apiData = {
        name: this.data.form.name,
        lng: this.data.form.longitude,
        lat: this.data.form.latitude,
        city: this.data.form.city,
        location: this.data.form.location,
        dayReceiver: `${this.data.form.dayShiftContact}/${this.data.form.dayShiftPhone}`,
        nightReceiver: `${this.data.form.nightShiftContact}/${this.data.form.nightShiftPhone}`,
        selfPickup: `自提/${this.data.form.selfPickupPhone}`
      };
      
      if (this.data.id) {
        await updateSite(this.data.id, apiData);
      } else {
        await createSite(apiData);
      }

      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (error) {
      console.error('保存站点失败:', error);
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
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
  }
}); 