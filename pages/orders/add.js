import { origins } from '../../utils/stations';
import { getEnums } from '../../services/enums';
import { createOrder } from '../../services/orders';
import { getSiteDestinations } from '../../services/sites';
import { formatTimestamp } from '../../utils/date';

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
    shipper: {
      contact: '',
      phone: '',
      address: ''
    },
    arrivalTime: formatTimestamp(new Date().getTime(), 'YYYY-MM-DD'),  // 默认当天
    showDatePicker: false,
    currentDate: new Date().getTime(),
    minDate: new Date().getTime(),

    // 货物信息
    cargo: {
      name: '',
      weight: '',
      volume: '',
      pallets: '',
    },

    stations: [],      // 所有提货站点

    // 回单信息
    receipt: {
      required: false,
      type: '',    // 从枚举获取默认值
      returnMethod: ''  // 从枚举获取默认值
    },
    paymentMethod: '',  // 从枚举获取默认值
    receiptTypes: [],
    returnMethods: [],
    paymentMethods: []
  },

  async onLoad() {
    this.loadStations();
    await this.loadEnums();
  },

  // 加载站点数据
  async loadStations() {
    try {
      const res = await getSiteDestinations();
      const sites = res;

      if (Array.isArray(sites)) {
        // 设置站点数据并默认选中第一个站点
        const firstStation = sites[0];
        const firstDestination = firstStation.destinations[0];
        const lineId = firstDestination.lineId;
        if (!lineId) {
          console.error('Missing lineId in destination:', firstDestination);
        }

        this.setData({
          stations: sites,
          pickupStationId: firstStation.id,
          pickupSiteName: firstStation.name,
          availableDestinations: firstStation.destinations,
          deliveryStationId: firstDestination.id,
          deliverySiteName: firstDestination.name,
          selectedDestination: {
            id: firstDestination.id,
            name: firstDestination.name,
            lineId: lineId
          }
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

  // 发货人信息输入处理
  onShipperInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`shipper.${field}`]: e.detail
    });
  },

  // 提交订单
  async onSubmit() {
    try {
      if (!this.validateForm()) return;

      wx.showLoading({ title: '提交中...' });

      // 构建请求数据
      const data = {
        pickupArea: this.data.pickupArea,
        deliveryArea: this.data.deliveryArea,
        pickupStationId: this.data.pickupStationId,
        deliveryStationId: this.data.deliveryStationId,
        cargo: {
          ...this.data.cargo,
          receipt: this.data.receipt
        },
        shipper: this.data.shipper,
        arrivalTime: Math.floor(new Date(this.data.arrivalTime).getTime() / 1000),  // 转换为秒级时间戳
        paymentMethod: this.data.paymentMethod,
        lineId: this.data.selectedDestination.lineId
      };

      const res = await createOrder(data);

      wx.showToast({
        title: '创建成功',
        icon: 'success'
      });

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

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
    if (!this.data.arrivalTime) {
      wx.showToast({ title: '请选择到仓日期', icon: 'none' });
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
    if (!this.data.shipper.phone) {
      wx.showToast({ title: '请输入发货电话', icon: 'none' });
      return false;
    }
    if (!this.data.shipper.address) {
      wx.showToast({ title: '请输入发货地址', icon: 'none' });
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
      deliverySiteName: station.name,
      selectedDestination: {
        id: station.id,
        name: station.name,
        lineId: station.lineId
      }
    });
  },

  // 显示日期选择器
  showDatePicker() {
    this.setData({ showDatePicker: true });
  },

  // 关闭日期选择器
  onDatePickerClose() {
    this.setData({ showDatePicker: false });
  },

  // 确认选择日期
  onDateConfirm(e) {
    this.setData({
      arrivalTime: formatTimestamp(e.detail, 'YYYY-MM-DD'),
      showDatePicker: false
    });
  },

  // 回单信息输入处理
  onReceiptRequiredChange(e) {
    this.setData({ 'receipt.required': e.detail });
  },

  // 回单类型选择处理
  onReceiptTypeChange(e) {
    this.setData({
      'receipt.type': e.detail
    });
  },

  // 回单方式选择处理
  onReturnMethodChange(e) {
    this.setData({
      'receipt.returnMethod': e.detail
    });
  },

  // 付款方式选择处理
  onPaymentMethodChange(e) {
    this.setData({
      paymentMethod: e.detail
    });
  },

  // 加载枚举数据
  async loadEnums() {
    try {
      const enums = await getEnums();

      // 将枚举对象转换为数组格式
      const receiptTypes = Object.entries(enums.receiptType).map(([value, name]) => ({ value, name }));
      const returnMethods = Object.entries(enums.returnMethod).map(([value, name]) => ({ value, name }));
      const paymentMethods = Object.entries(enums.paymentMethod).map(([value, name]) => ({ value, name }));

      // 设置枚举数据和默认值
      this.setData({
        receiptTypes,
        returnMethods,
        paymentMethods,
        'receipt.type': receiptTypes[0]?.value || '',
        'receipt.returnMethod': returnMethods[0]?.value || '',
        paymentMethod: paymentMethods[0]?.value || ''
      });
    } catch (error) {
      console.error('加载枚举数据失败:', error);
      wx.showToast({
        title: '加载枚举数据失败',
        icon: 'none'
      });
    }
  },

  onDestinationChange(e) {
    const destination = this.data.destinations.find(
      item => item.id === e.detail
    );
    this.setData({
      selectedDestination: {
        id: destination.id,
        name: destination.name,
        price: destination.price,
        lineId: destination.lineId
      }
    });
  },
}); 