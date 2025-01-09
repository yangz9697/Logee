import { formatTimestamp, parseDateTime } from '../../utils/date';

Page({
  data: {
    order: {
      id: '',    // 订单号
      waybillNo: '',  // 运单号
      pickupArea: '',
      deliveryArea: '',
      pickupSiteName: '',
      deliverySiteName: '',
      paymentMethod: '', 
      statusName: '',
      cargo: {
        name: '',
        weight: '',
        volume: '',
        pallets: '',
        receipt: {
          required: false,
          type: '',
          returnMethod: ''
        }
      },
      fees: {
        tech: 0,
        total: 0
      },
      createTime: ''
    },
    // 回单类型枚举
    receiptTypeEnum: {
      electronic: '电子',
      paper: '纸质'
    },
    // 回传方式枚举
    returnMethodEnum: {
      photo: '拍照',
      mail: '邮寄'
    },
    isRefreshing: false,
    showDatePicker: false,
    currentDate: new Date().getTime(),
    minDate: new Date().getTime(),
  },

  getDateTime(timestamp, format) {
    if (!timestamp) return '';
    // 如果时间戳是13位的毫秒级，不需要转换
    // 如果是10位的秒级时间戳，需要转换为毫秒级
    const msTimestamp = String(timestamp).length === 10 ? timestamp * 1000 : timestamp;
    return formatTimestamp(msTimestamp, format);
  },

  onEditBasic() {
    this.setData({
      showBasicPopup: true,
      editingBasic: {
        paymentMethod: this.data.order.paymentMethod,
        waybillNo: this.data.order.waybillNo || '',
        arrivalTime: this.data.order.arrivalTime ? formatTimestamp(this.data.order.arrivalTime, 'YYYY-MM-DD') : '',
        remark: this.data.order.remark || ''
      }
    });
  },

  onBasicPopupClose() {
    this.setData({ showBasicPopup: false });
  },

  onPaymentMethodChange(e) {
    this.setData({
      'editingBasic.paymentMethod': e.detail
    });
  },

  async saveBasic() {
    try {
      // 构造请求数据
      const basicData = {
        waybillNo: this.data.editingBasic.waybillNo,
        paymentMethod: this.data.editingBasic.paymentMethod,
        arrivalTime: this.data.editingBasic.arrivalTime ? parseDateTime(this.data.editingBasic.arrivalTime) : null,
        remark: this.data.editingBasic.remark || ''
      };
      
      // 调用更新接口
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `http://49.234.42.166:3000/api/orders/${this.data.order.id}/basic`,
          method: 'PATCH',
          header: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzdhN2QxNDM5NmMwNjI5N2ZiMjA4ZDMiLCJyb2xlSWQiOiI2NzYyYzE1YjZiMjI4ZjMzMmQxMjAyMzEiLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzM2MDg2OTk3LCJleHAiOjE3Mzg2Nzg5OTd9.P4l_5Fj20k-DyR1fbQiuiWi8LGNnz6x4Duwi7qmVGmw'
          },
          data: basicData,
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res.data);
            } else {
              reject(new Error(res.data.message || '更新基本信息失败'));
            }
          },
          fail: reject
        });
      });

      // 关闭弹窗
      this.setData({ showBasicPopup: false });
      
      // 刷新详情数据
      await this.loadOrderDetail(this.data.order.id);
      
      wx.showToast({
        title: res.message || '保存成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('保存基本信息失败:', error);
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      });
    }
  },

  onEditCargo() {
    this.setData({
      showCargoPopup: true,
      editingCargo: {
        name: this.data.order.cargo.name,
        weight: this.data.order.cargo.weight,
        volume: this.data.order.cargo.volume,
        pallets: this.data.order.cargo.pallets,
        receipt: {
          required: this.data.order.cargo.receipt.required,
          type: this.data.order.cargo.receipt.type || 'electronic',  // 默认电子
          returnMethod: this.data.order.cargo.receipt.returnMethod || 'photo'  // 默认拍照
        }
      }
    });
  },

  onEditShipping() {
    this.setData({
      showShippingPopup: true,
      editingShipping: {
        shipper: {
          contact: this.data.order.shipper.contact || '',
          phone: this.data.order.shipper.phone || '',
          address: this.data.order.shipper.address || ''
        },
        receiver: {
          contact: this.data.order.receiver.contact || '',
          phone: this.data.order.receiver.phone || '',
          address: this.data.order.receiver.address || ''
        }
      }
    });
  },

  onEditOther() {
    wx.navigateTo({
      url: `/pages/orders/edit/other?id=${this.data.order.id}`
    });
  },

  goToPickupDoc() {
    wx.navigateTo({
      url: `/pages/orders/pickup-doc?id=${this.data.order.id}`
    });
  },

  goToDeliveryDoc() {
    wx.navigateTo({
      url: `/pages/orders/delivery-doc?id=${this.data.order.id}`
    });
  },

  makeCall(e) {
    const phone = e.currentTarget.dataset.phone;
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: (err) => {
        console.error('拨打电话失败:', err);
        // 如果拨打失败，自动复制号码
        this.copyPhone(e);
      }
    });
  },

  copyPhone(e) {
    const phone = e.currentTarget.dataset.phone;
    wx.setClipboardData({
      data: phone,
      success: () => {
        wx.showToast({
          title: '电话已复制',
          icon: 'none'
        });
      }
    });
  },

  copyAddress(e) {
    const address = e.currentTarget.dataset.address;
    wx.setClipboardData({
      data: address,
      success: () => {
        wx.showToast({
          title: '地址已复制',
          icon: 'none'
        });
      }
    });
  },

  copyOrderId() {
    wx.setClipboardData({
      data: this.data.order.waybillNo,
      success: () => {
        wx.showToast({
          title: '运单号已复制',
          icon: 'none'
        });
      }
    });
  },

  onOrderFlow() {
    wx.navigateTo({
      url: `/pages/orders/flow?id=${this.data.order.id}`
    });
  },

  async onLoad(options) {
    const { id } = options;
    await this.loadOrderDetail(id);
  },

  async loadOrderDetail(id) {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `http://49.234.42.166:3000/api/orders/${id}`,
          method: 'GET',
          header: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzdhN2QxNDM5NmMwNjI5N2ZiMjA4ZDMiLCJyb2xlSWQiOiI2NzYyYzE1YjZiMjI4ZjMzMmQxMjAyMzEiLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzM2MDg2OTk3LCJleHAiOjE3Mzg2Nzg5OTd9.P4l_5Fj20k-DyR1fbQiuiWi8LGNnz6x4Duwi7qmVGmw'
          },
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res.data);
            } else {
              reject(new Error(res.data.message || '获取订单详情失败'));
            }
          },
          fail: reject
        });
      });

      // 处理费用单位转换（从分转为元）
      const fees = {
        pickup: res.fees.pickup,
        delivery: res.fees.delivery,
        tech: res.fees.tech,
        total: res.fees.total
      };

      // 更新订单数据
      this.setData({
        order: {
          ...res,
          fees,
          createTimeText: this.getDateTime(res.createTime, 'YYYY-MM-DD HH:mm'),  // 预先格式化创建时间
          arrivalTimeText: res.arrivalTime ? this.getDateTime(res.arrivalTime, 'YYYY-MM-DD') : '待补充'  // 只显示日期
        }
      });

    } catch (error) {
      console.error('加载订单详情失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    }
  },

  showFeeEditor() {
    console.log('showFeeEditor called');
    this.setData({
      showFeePopup: true,
      editingFees: {
        pickup: this.data.order.fees.pickup,
        delivery: this.data.order.fees.delivery,
        tech: this.data.order.fees.tech,
        total: this.data.order.fees.total
      }
    });
  },

  onFeePopupClose() {
    this.setData({ showFeePopup: false });
  },

  onFeeChange(e) {
    const { type } = e.currentTarget.dataset;
    const value = e.detail;
    
    this.setData({
      [`editingFees.${type}`]: value
    });
  },

  async saveFees() {
    try {
      // 构造请求数据
      const feesData = {
        pickup: Number(this.data.editingFees.pickup),
        delivery: Number(this.data.editingFees.delivery),
        tech: Number(this.data.editingFees.tech),
        total: Number(this.data.editingFees.total)
      };
      
      // 调用更新接口
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `http://49.234.42.166:3000/api/orders/${this.data.order.id}/fees`,
          method: 'PATCH',
          header: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzdhN2QxNDM5NmMwNjI5N2ZiMjA4ZDMiLCJyb2xlSWQiOiI2NzYyYzE1YjZiMjI4ZjMzMmQxMjAyMzEiLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzM2MDg2OTk3LCJleHAiOjE3Mzg2Nzg5OTd9.P4l_5Fj20k-DyR1fbQiuiWi8LGNnz6x4Duwi7qmVGmw'
          },
          data: feesData,
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res.data);
            } else {
              reject(new Error(res.data.message || '更新费用信息失败'));
            }
          },
          fail: reject
        });
      });

      // 关闭弹窗
      this.setData({ showFeePopup: false });
      
      // 刷新详情数据
      await this.loadOrderDetail(this.data.order.id);
      
      wx.showToast({
        title: res.message || '保存成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('保存费用失败:', error);
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      });
    }
  },

  onShippingPopupClose() {
    this.setData({ showShippingPopup: false });
  },

  async saveShipping() {
    try {
      // 构造请求数据
      const shippingData = {
        shipper: {
          contact: this.data.editingShipping.shipper.contact,
          phone: this.data.editingShipping.shipper.phone,
          address: this.data.editingShipping.shipper.address
        },
        receiver: {
          contact: this.data.editingShipping.receiver.contact,
          phone: this.data.editingShipping.receiver.phone,
          address: this.data.editingShipping.receiver.address
        }
      };
      
      // 调用更新接口
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `http://49.234.42.166:3000/api/orders/${this.data.order.id}/shipping`,
          method: 'PATCH',
          header: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzdhN2QxNDM5NmMwNjI5N2ZiMjA4ZDMiLCJyb2xlSWQiOiI2NzYyYzE1YjZiMjI4ZjMzMmQxMjAyMzEiLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzM2MDg2OTk3LCJleHAiOjE3Mzg2Nzg5OTd9.P4l_5Fj20k-DyR1fbQiuiWi8LGNnz6x4Duwi7qmVGmw'
          },
          data: shippingData,
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res.data);
            } else {
              reject(new Error(res.data.message || '更新联系信息失败'));
            }
          },
          fail: reject
        });
      });

      // 关闭弹窗
      this.setData({ showShippingPopup: false });
      
      // 刷新详情数据
      await this.loadOrderDetail(this.data.order.id);
      
      wx.showToast({
        title: res.message || '保存成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('保存联系信息失败:', error);
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      });
    }
  },

  onCargoPopupClose() {
    this.setData({ showCargoPopup: false });
  },

  onReceiptChange(e) {
    this.setData({
      'editingCargo.receipt.required': e.detail
    });
  },

  onReceiptTypeChange(e) {
    this.setData({
      'editingCargo.receipt.type': e.detail
    });
  },

  onReturnMethodChange(e) {
    this.setData({
      'editingCargo.receipt.returnMethod': e.detail
    });
  },

  async saveCargo() {
    try {
      // 构造请求数据
      const cargoData = {
        name: this.data.editingCargo.name,
        weight: Number(this.data.editingCargo.weight),
        volume: Number(this.data.editingCargo.volume),
        pallets: this.data.editingCargo.pallets,
        receipt: {
          required: this.data.editingCargo.receipt.required,
          type: this.data.editingCargo.receipt.type,
          returnMethod: this.data.editingCargo.receipt.returnMethod
        }
      };
      
      // 调用更新接口
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `http://49.234.42.166:3000/api/orders/${this.data.order.id}/cargo`,
          method: 'PATCH',
          header: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzdhN2QxNDM5NmMwNjI5N2ZiMjA4ZDMiLCJyb2xlSWQiOiI2NzYyYzE1YjZiMjI4ZjMzMmQxMjAyMzEiLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzM2MDg2OTk3LCJleHAiOjE3Mzg2Nzg5OTd9.P4l_5Fj20k-DyR1fbQiuiWi8LGNnz6x4Duwi7qmVGmw'
          },
          data: cargoData,
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res.data);
            } else {
              reject(new Error(res.data.message || '更新货物信息失败'));
            }
          },
          fail: reject
        });
      });

      // 关闭弹窗
      this.setData({ showCargoPopup: false });
      
      // 刷新详情数据
      await this.loadOrderDetail(this.data.order.id);
      
      wx.showToast({
        title: res.message || '保存成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('保存货物信息失败:', error);
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      });
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    try {
      this.setData({ isRefreshing: true });
      await this.loadOrderDetail(this.data.order.id);
    } catch (error) {
      console.error('刷新失败:', error);
      wx.showToast({
        title: '刷新失败',
        icon: 'none'
      });
    } finally {
      this.setData({ isRefreshing: false });
      wx.stopPullDownRefresh();
    }
  },

  // 显示日期选择器
  showDatePicker() {
    this.setData({
      showDatePicker: true,
      currentDate: this.data.editingBasic.arrivalTime ? 
        parseDateTime(this.data.editingBasic.arrivalTime) : 
        new Date().getTime()
    });
  },

  // 关闭日期选择器
  onDatePickerClose() {
    this.setData({ showDatePicker: false });
  },

  // 确认选择日期
  onDateConfirm(e) {
    const date = new Date(e.detail);
    this.setData({
      'editingBasic.arrivalTime': formatTimestamp(date.getTime(), 'YYYY-MM-DD'),
      showDatePicker: false
    });
  },

  // 运单号变更
  onWaybillNoChange(e) {
    this.setData({
      'editingBasic.waybillNo': e.detail
    });
  },

  // 备注变更
  onRemarkChange(e) {
    this.setData({
      'editingBasic.remark': e.detail
    });
  },

  // 货物名称变更
  onCargoNameChange(e) {
    this.setData({
      'editingCargo.name': e.detail
    });
  },

  // 货物重量变更
  onCargoWeightChange(e) {
    this.setData({
      'editingCargo.weight': e.detail
    });
  },

  // 货物体积变更
  onCargoVolumeChange(e) {
    this.setData({
      'editingCargo.volume': e.detail
    });
  },

  // 托盘信息变更
  onCargoPalletsChange(e) {
    this.setData({
      'editingCargo.pallets': e.detail
    });
  },

  // 发货方联系人变更
  onShipperContactChange(e) {
    this.setData({
      'editingShipping.shipper.contact': e.detail
    });
  },

  // 发货方电话变更
  onShipperPhoneChange(e) {
    this.setData({
      'editingShipping.shipper.phone': e.detail
    });
  },

  // 发货方地址变更
  onShipperAddressChange(e) {
    this.setData({
      'editingShipping.shipper.address': e.detail
    });
  },

  // 收货方联系人变更
  onReceiverContactChange(e) {
    this.setData({
      'editingShipping.receiver.contact': e.detail
    });
  },

  // 收货方电话变更
  onReceiverPhoneChange(e) {
    this.setData({
      'editingShipping.receiver.phone': e.detail
    });
  },

  // 收货方地址变更
  onReceiverAddressChange(e) {
    this.setData({
      'editingShipping.receiver.address': e.detail
    });
  },
}); 