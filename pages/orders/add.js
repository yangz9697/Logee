import { origins } from '../../utils/stations';
import { getEnums } from '../../utils/enums';

Page({
  data: {
    // 基本信息
    pickupArea: '',
    deliveryArea: '',
    pickupSiteName: '',
    deliverySiteName: '',
    pickupStationId: '',
    deliveryStationId: '',
    availableDestinations: [],  // 可选的送货站点
    paymentMethod: 'return',  // 默认回付

    // 货物信息
    cargo: {
      name: '',
      weight: '',
      volume: '',
      pallets: '',
      receipt: {
        required: true,  // 默认需要回单
        type: 'paper',   // 默认纸质回单
        returnMethod: 'photo'  // 默认拍照回传
      }
    },

    // 费用信息
    fees: {
      tech: '',
      total: ''
    },

    showStationPopup: false,
    selectingType: '',  // pickup/delivery
    stations: [],      // 所有提货站点
    enums: null,  // 枚举数据
  },

  async onLoad() {
    this.loadStations();
    const enums = await getEnums();
    this.setData({ enums });
  },

  // 加载站点数据
  async loadStations() {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'http://49.234.42.166:3000/api/site-destinations',
          method: 'GET',
          header: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzdhN2QxNDM5NmMwNjI5N2ZiMjA4ZDMiLCJyb2xlSWQiOiI2NzYyYzE1YjZiMjI4ZjMzMmQxMjAyMzEiLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzM2MDg2OTk3LCJleHAiOjE3Mzg2Nzg5OTd9.P4l_5Fj20k-DyR1fbQiuiWi8LGNnz6x4Duwi7qmVGmw'
          },
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res.data);
            } else {
              reject(new Error(`Request failed with status ${res.statusCode}`));
            }
          },
          fail: reject
        });
      });

      if (Array.isArray(res)) {
        // 设置站点数据并默认选中第一个站点
        const firstStation = res[0];
        const firstDestination = firstStation.destinations[0];
        this.setData({
          stations: res,
          pickupStationId: firstStation.id,
          pickupSiteName: firstStation.name,
          availableDestinations: firstStation.destinations,
          deliveryStationId: firstDestination.id,
          deliverySiteName: firstDestination.name
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('加载站点失败:', error);
      wx.showToast({
        title: '加载站点失败',
        icon: 'none'
      });
    }
  },

  // 输入事件处理
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [field]: e.detail
    });
  },

  // 货物信息输入处理
  onCargoInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`cargo.${field}`]: e.detail
    });
  },

  // 付款方式变更
  onPaymentMethodChange(e) {
    this.setData({
      paymentMethod: e.detail
    });
  },

  // 切换回单要求
  onToggleReceipt(e) {
    this.setData({
      'cargo.receipt.required': e.detail
    });
  },

  // 选择回单类型
  onSelectReceiptType(e) {
    this.setData({
      'cargo.receipt.type': e.detail
    });
  },

  // 选择回传方式
  onSelectReturnMethod(e) {
    this.setData({
      'cargo.receipt.returnMethod': e.detail
    });
  },

  // 计算总费用
  calculateTotal() {
    const { tech } = this.data.fees;
    const total = Number(tech || 0);
    this.setData({
      'fees.total': total
    });
  },

  // 费用信息输入处理
  onFeesInput(e) {
    const { field } = e.currentTarget.dataset;
    // 确保输入的是整数
    const value = parseInt(e.detail) || '';
    this.setData({
      [`fees.${field}`]: value
    });
  },

  // 提交订单
  async onSubmit() {
    try {
      // 表单验证
      if (!this.validateForm()) {
        return;
      }

      // 构造请求数据
      const orderData = {
        pickupArea: this.data.pickupArea,
        deliveryArea: this.data.deliveryArea,
        pickupSite: this.data.pickupStationId,
        deliverySite: this.data.deliveryStationId,
        paymentMethod: this.data.paymentMethod,
        fees: {
          tech: Number(this.data.fees.tech) * 100, // 转换为分
          total: Number(this.data.fees.total) * 100
        },
        cargo: {
          name: this.data.cargo.name,
          weight: Number(this.data.cargo.weight),
          volume: Number(this.data.cargo.volume),
          pallets: this.data.cargo.pallets,
          receipt: this.data.cargo.receipt
        }
      };

      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'http://49.234.42.166:3000/api/orders',
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzdhN2QxNDM5NmMwNjI5N2ZiMjA4ZDMiLCJyb2xlSWQiOiI2NzYyYzE1YjZiMjI4ZjMzMmQxMjAyMzEiLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzM2MDg2OTk3LCJleHAiOjE3Mzg2Nzg5OTd9.P4l_5Fj20k-DyR1fbQiuiWi8LGNnz6x4Duwi7qmVGmw'
          },
          data: orderData,
          success: (res) => {
            if (res.data && res.data.success) {
              resolve(res.data);
            } else {
              reject(new Error(res.data.message || '创建订单失败'));
            }
          },
          fail: reject
        });
      });

      // 返回列表页并刷新
      const pages = getCurrentPages();
      const ordersPage = pages[pages.length - 2];  // 获取订单列表页面
      if (ordersPage) {
        // 刷新订单列表和订单数量
        ordersPage.loadOrders('processing');
        ordersPage.loadOrderCounts();
      }

      // 先显示成功提示
      wx.showToast({
        title: res.message || '创建成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          // 提示显示后再返回
          setTimeout(() => {
            wx.navigateBack();
          }, 1000);
        }
      });

    } catch (error) {
      console.error('创建订单失败:', error);
      wx.showToast({
        title: error.message || '创建失败',
        icon: 'none'
      });
    }
  },

  // 表单验证
  validateForm() {
    if (!this.data.pickupArea) {
      wx.showToast({ title: '请输入提货地区', icon: 'none' });
      return false;
    }
    if (!this.data.deliveryArea) {
      wx.showToast({ title: '请输入送货地区', icon: 'none' });
      return false;
    }
    if (!this.data.pickupStationId) {
      wx.showToast({ title: '请选择提货站点', icon: 'none' });
      return false;
    }
    if (!this.data.deliveryStationId) {
      wx.showToast({ title: '请选择送货站点', icon: 'none' });
      return false;
    }
    if (!this.data.cargo.name) {
      wx.showToast({ title: '请输入货物名称', icon: 'none' });
      return false;
    }
    if (!this.data.cargo.weight) {
      wx.showToast({ title: '请输入货物重量', icon: 'none' });
      return false;
    }
    if (!this.data.cargo.volume) {
      wx.showToast({ title: '请输入货物体积', icon: 'none' });
      return false;
    }
    if (!this.data.fees.total) {
      wx.showToast({ title: '请输入费用信息', icon: 'none' });
      return false;
    }
    return true;
  },

  // 选择始发站点
  onStartPointChange(e) {
    const station = e.currentTarget.dataset.station;
    this.setData({
      pickupStationId: station.id,
      pickupSiteName: station.name,
      availableDestinations: station.destinations,
      // 清空已选择的送货站点
      deliveryStationId: '',
      deliverySiteName: ''
    });
  },

  // 选择到达站点
  onEndPointChange(e) {
    const station = e.currentTarget.dataset.station;
    this.setData({
      deliveryStationId: station.id,
      deliverySiteName: station.name
    });
  },

  // 关闭站点选择弹窗
  onStationPopupClose() {
    this.setData({
      showStationPopup: false
    });
  },
}); 