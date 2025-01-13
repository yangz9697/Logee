const { getDispatchDetail, updateDispatchStatus, updateTransportBasic, updateTransportFee } = require('../../services/dispatch');
const { formatTimestamp } = require('../../utils/date');

Page({
  data: {
    dispatchId: '',
    dispatch: {
      id: '',
      orderId: '',
      orderNo: '',
      statusName: '',
      typeName: '',
      driverId: '',
      driverName: '',
      driverPhone: '',
      plateNumber: '',
      createTime: '',
      // ... 其他字段
    },
    isLoading: false,
    showDeliveryPopup: false,
    showCompletePopup: false,
    vehicleTypes: [
      { value: 'flatbed', name: '平板' },
      { value: 'highfence', name: '高栏' },
      { value: 'van', name: '厢车' },
      { value: 'other', name: '其他' }
    ],
    deliveryForm: {
      distance: '',
      price: '',
      driverName: '',
      driverPhone: '',
      vehicle: {
        length: '',
        width: '',
        plateNumber: '',
        type: 'flatbed',
        typeName: '平板'
      }
    },
    completeForm: {
      price: '',
      hasReceipt: false
    }
  },

  onLoad(options) {
    const { id } = options;
    this.loadDispatchDetail(id);
  },

  async loadDispatchDetail(id) {
    try {
      wx.showLoading({ title: '加载中...' });
      const res = await getDispatchDetail(id);
      console.log(res);
      // 添加格式化的时间
      const dispatch = {
        ...res,
        createTimeText: formatTimestamp(res.createTime),
        nextAction: res.actions?.[0] || null
      };

      this.setData({ dispatch });
    } catch (error) {
      console.error('加载调度单详情失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 复制文本
  copyText(e) {
    const { text } = e.currentTarget.dataset;
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
      }
    });
  },

  // 拨打电话
  makeCall(e) {
    const { phone } = e.currentTarget.dataset;
    wx.makePhoneCall({
      phoneNumber: phone
    });
  },

  // 状态流转
  async onStatusChange() {
    try {
      const { dispatch } = this.data;
      if (!dispatch.nextAction) return;

      // 开始运输，录入司机和车辆信息
      if (dispatch.nextAction.action === 'start_shipping') {
        this.setData({ showDeliveryPopup: true });
        return;
      }

      // 完成运输，录入价格和回单信息
      if (dispatch.nextAction.action === 'complete') {
        this.setData({ showCompletePopup: true });
        return;
      }

      wx.showLoading({ title: '处理中...' });
      
      await updateDispatchStatus(dispatch.id, dispatch.nextAction.action);

      // 重新加载详情
      this.loadDispatchDetail(dispatch.id);

      wx.showToast({
        title: '操作成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('操作失败:', error);
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 关闭弹窗
  onDeliveryPopupClose() {
    this.setData({ showDeliveryPopup: false });
  },

  onCompletePopupClose() {
    this.setData({ showCompletePopup: false });
  },

  // 选择车型
  onVehicleTypeChange(e) {
    const type = e.detail;
    const typeName = this.data.vehicleTypes.find(item => item.value === type)?.name || '';
    this.setData({
      'deliveryForm.vehicle.type': type,
      'deliveryForm.vehicle.typeName': typeName
    });
  },

  // 点击编辑送达信息
  onEditDelivery() {
    const { delivery } = this.data.dispatch;
    // 将现有数据填充到表单
    this.setData({
      deliveryForm: {
        distance: delivery.distance,
        price: delivery.price,
        vehicle: {
          length: delivery.vehicle.length,
          width: delivery.vehicle.width,
          type: delivery.vehicle.type,
          typeName: delivery.vehicle.typeName
        }
      },
      showDeliveryPopup: true
    });
  },

  // 表单字段变化处理
  onDriverNameChange(e) {
    this.setData({ 'deliveryForm.driverName': e.detail });
  },

  onDriverPhoneChange(e) {
    this.setData({ 'deliveryForm.driverPhone': e.detail });
  },

  onDeliveryDistanceChange(e) {
    this.setData({ 'deliveryForm.distance': e.detail });
  },

  onCompletePriceChange(e) {
    this.setData({ 'completeForm.price': e.detail });
  },

  onHasReceiptChange(e) {
    this.setData({ 'completeForm.hasReceipt': e.detail });
  },

  onVehicleLengthChange(e) {
    this.setData({ 'deliveryForm.vehicle.length': e.detail });
  },

  onVehicleWidthChange(e) {
    this.setData({ 'deliveryForm.vehicle.width': e.detail });
  },

  onVehiclePlateNumberChange(e) {
    this.setData({ 'deliveryForm.vehicle.plateNumber': e.detail });
  },

  // 提交送达信息
  async submitDelivery() {
    try {
      const { deliveryForm } = this.data;
      
      // 验证表单
      if (!deliveryForm.distance) {
        wx.showToast({ title: '请输入运输距离', icon: 'none' });
        return;
      }
      if (!deliveryForm.price) {
        wx.showToast({ title: '请输入运输价格', icon: 'none' });
        return;
      }
      if (!deliveryForm.vehicle.length || !deliveryForm.vehicle.width) {
        wx.showToast({ title: '请输入车辆尺寸', icon: 'none' });
        return;
      }
      if (!deliveryForm.vehicle.plateNumber) {
        wx.showToast({ title: '请输入车牌号', icon: 'none' });
        return;
      }

      wx.showLoading({ title: '处理中...' });
      
      // 先更新运输信息
      await updateTransportInfo(this.data.dispatch.id, {
        distance: Number(deliveryForm.distance),
        price: Number(deliveryForm.price),
        vehicle: {
          typeId: deliveryForm.vehicle.type,
          length: Number(deliveryForm.vehicle.length),
          width: Number(deliveryForm.vehicle.width),
          plateNumber: deliveryForm.vehicle.plateNumber
        }
      });
      
      // 再更新状态为已完成
      await updateDispatchStatus(this.data.dispatch.id, 'complete');

      // 重新加载详情
      await this.loadDispatchDetail(this.data.dispatch.id);
      this.setData({ showDeliveryPopup: false });

      wx.showToast({
        title: '操作成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('提交送达信息失败:', error);
      wx.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 跳转到订单详情
  goToOrder() {
    wx.navigateTo({
      url: `/pages/orders/detail?id=${this.data.dispatch.orderId}`
    });
  },

  // 跳转到提货单详情
  goToPickupDispatch() {
    wx.navigateTo({
      url: `/pages/dispatch/detail?id=${this.data.dispatch.pickupDispatch.id}`
    });
  },

  // 验证表单
  validateDeliveryForm() {
    if (!this.data.deliveryForm.driverName) {
      wx.showToast({ title: '请输入司机姓名', icon: 'none' });
      return false;
    }
    if (!this.data.deliveryForm.driverPhone) {
      wx.showToast({ title: '请输入司机电话', icon: 'none' });
      return false;
    }
    if (!this.data.deliveryForm.vehicle.plateNumber) {
      wx.showToast({ title: '请输入车牌号', icon: 'none' });
      return false;
    }
    if (!this.data.deliveryForm.vehicle.length) {
      wx.showToast({ title: '请输入车长', icon: 'none' });
      return false;
    }
    if (!this.data.deliveryForm.vehicle.width) {
      wx.showToast({ title: '请输入车宽', icon: 'none' });
      return false;
    }
    if (!this.data.deliveryForm.distance) {
      wx.showToast({ title: '请输入运输距离', icon: 'none' });
      return false;
    }
    return true;
  },

  // 验证完成运输表单
  validateCompleteForm() {
    if (!this.data.completeForm.price) {
      wx.showToast({ title: '请输入运输价格', icon: 'none' });
      return false;
    }
    return true;
  },

  // 保存开始运输信息
  async saveDelivery() {
    try {
      if (!this.validateDeliveryForm()) return;

      wx.showLoading({ title: '保存中...' });

      const data = {
        driverName: this.data.deliveryForm.driverName,
        driverPhone: this.data.deliveryForm.driverPhone,
        distance: Number(this.data.deliveryForm.distance),
        vehicle: {
          plateNumber: this.data.deliveryForm.vehicle.plateNumber,
          length: Number(this.data.deliveryForm.vehicle.length),
          width: Number(this.data.deliveryForm.vehicle.width),
          typeName: this.data.deliveryForm.vehicle.typeName
        }
      };

      await updateTransportBasic(this.data.dispatch.id, data);
      await updateDispatchStatus(this.data.dispatch.id, 'start_shipping');

      this.setData({ showDeliveryPopup: false });
      this.loadDispatchDetail(this.data.dispatch.id);

      wx.showToast({
        title: '已开始运输',
        icon: 'success'
      });
    } catch (error) {
      console.error('保存运输信息失败:', error);
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 保存完成运输信息
  async saveComplete() {
    try {
      if (!this.validateCompleteForm()) return;

      wx.showLoading({ title: '保存中...' });

      const data = {
        price: Number(this.data.completeForm.price),
        hasReceipt: this.data.completeForm.hasReceipt
      };

      await updateTransportFee(this.data.dispatch.id, data);
      await updateDispatchStatus(this.data.dispatch.id, 'complete');

      this.setData({ showCompletePopup: false });
      this.loadDispatchDetail(this.data.dispatch.id);

      wx.showToast({
        title: '已完成运输',
        icon: 'success'
      });
    } catch (error) {
      console.error('保存完成信息失败:', error);
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  }
}); 