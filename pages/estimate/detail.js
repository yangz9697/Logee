const amapService = require('../../services/amap');
const { MOCK_RESPONSE, USE_MOCK } = require('../../constants/index');

Page({
  data: {
    origin: null,
    destination: null,
    imagePath: '',
    ocrText: '',
    loadingAddress: '',
    unloadingAddress: '',
    pickupDistance: '',
    deliveryDistance: '',
    pickupPrice: '0',
    deliveryPrice: '0',
    transitPrice: 100,
    totalPrice: 0,
    cargoName: '',
    packageType: '',
    volume: '',
    weight: 5,
    vehicleLength: '',
    truckType: '',
    remark: '',
    isLoading: false,
    errorMessage: '',
    useMock: USE_MOCK,
    suggestPrice: '0',
    palletCount: 0
  },

  async onLoad(options) {
    try {
      this.setData({ isLoading: true });

      if (!options.data || this.data.useMock) {
        this.setData({
          ...MOCK_RESPONSE
        }, () => {
          this.calculateTransitTotal();
          this.calculateSuggestPrice();
        });
        return;
      }

      const data = JSON.parse(decodeURIComponent(options.data));
      console.log(data);
      this.setData({
        origin: data.origin,
        destination: data.destination,
        imagePath: data.imagePath,
        ocrText: data.ocrText,
        suggestPrice: (data.totalQuote || 2000).toString(),
        weight: data.weight,
        vehicleLength: data.vehicleLength + '米',
        transitPrice: data.transitPrice
      });

      if (data.loadingAddress && data.unloadingAddress) {
        await this.getAccurateLocations(data.loadingAddress, data.unloadingAddress);
      }
    } catch (error) {
      this.handleError(error);
    } finally {
      this.setData({ isLoading: false });
    }
  },

  handleError(error) {
    console.error('操作失败:', error);
    this.setData({
      errorMessage: error.message || '操作失败，请重试'
    });
    wx.showToast({
      title: error.message || '操作失败',
      icon: 'none',
      duration: 2000
    });
  },

  async getAccurateLocations(loadingAddress, unloadingAddress) {
    try {
      const loadingLocation = await amapService.getLocationByAddress(loadingAddress);
      const unloadingLocation = await amapService.getLocationByAddress(unloadingAddress);

      const pickupDistance = await amapService.calculateRouteDistance(
        { longitude: this.data.origin.lng, latitude: this.data.origin.lat },
        loadingLocation
      );

      const deliveryDistance = await amapService.calculateRouteDistance(
        { longitude: this.data.destination.lng, latitude: this.data.destination.lat },
        unloadingLocation
      );

      const pickupCost = this.calculateDeliveryCost(this.data.weight, pickupDistance);
      const deliveryCost = this.calculateDeliveryCost(this.data.weight, deliveryDistance);

      this.updatePageData({
        loadingAddress,
        unloadingAddress,
        loadingLocation,
        unloadingLocation,
        pickupDistance: `${pickupDistance}公里`,
        deliveryDistance: `${deliveryDistance}公里`,
        pickupPrice: pickupCost.toString(),
        deliveryPrice: deliveryCost.toString()
      });

    } catch (error) {
      throw new Error(`获取位置信息失败: ${error.message}`);
    }
  },

  calculateDeliveryCost(weight, distance) {
    const cost = 27 * weight + 2 * distance - 10;
    return Math.round(cost / 10) * 10;
  },

  updatePageData(data) {
    this.setData({
      loadingAddress: data.loadingAddress,
      unloadingAddress: data.unloadingAddress,
      pickupDistance: data.pickupDistance,
      deliveryDistance: data.deliveryDistance,
      loadingLocation: data.loadingLocation,
      unloadingLocation: data.unloadingLocation,
      pickupPrice: data.pickupPrice,
      deliveryPrice: data.deliveryPrice
    }, () => {
      this.calculateSuggestPrice();
    });
  },

  calculateTotalPrice() {
    const total = this.data.pickupPrice + this.data.deliveryPrice;
    
    this.setData({
      totalPrice: total.toFixed(2)
    });
  },

  calculateTransitTotal() {
    const transitTotal = this.data.transitPrice * this.data.weight;
    this.setData({
      transitTotal: transitTotal.toFixed(2)
    });
  },

  calculateSuggestPrice() {
    const pickupPrice = parseInt(this.data.pickupPrice) || 0;
    const deliveryPrice = parseInt(this.data.deliveryPrice) || 0;
    const transitCost = this.data.transitPrice * this.data.weight;
    const suggestPrice = pickupPrice + deliveryPrice + transitCost + 400;

    const roundedPrice = Math.ceil(suggestPrice / 50) * 50;

    this.setData({
      suggestPrice: roundedPrice.toString()
    });
  },

  onTotalQuoteChange(event) {
    this.setData({
      suggestPrice: event.detail.toString()
    }, () => {
      this.calculateSuggestPrice();
    });
  },

  onPickupPriceChange(event) {
    this.setData({
      pickupPrice: event.detail.toString()
    }, () => {
      this.calculateSuggestPrice();
    });
  },

  onDeliveryPriceChange(event) {
    this.setData({
      deliveryPrice: event.detail.toString()
    }, () => {
      this.calculateSuggestPrice();
    });
  },

  increasePickupPrice() {
    this.setData({
      pickupPrice: (parseInt(this.data.pickupPrice) + 10).toString()
    }, () => {
      this.calculateSuggestPrice();
    });
  },

  decreasePickupPrice() {
    this.setData({
      pickupPrice: Math.max(0, parseInt(this.data.pickupPrice) - 10).toString()
    }, () => {
      this.calculateSuggestPrice();
    });
  },

  increaseDeliveryPrice() {
    this.setData({
      deliveryPrice: (parseInt(this.data.deliveryPrice) + 10).toString()
    }, () => {
      this.calculateSuggestPrice();
    });
  },

  decreaseDeliveryPrice() {
    this.setData({
      deliveryPrice: Math.max(0, parseInt(this.data.deliveryPrice) - 10).toString()
    }, () => {
      this.calculateSuggestPrice();
    });
  },

  increaseWeight() {
    this.setData({
      weight: this.data.weight + 0.1
    }, () => {
      if (this.data.loadingLocation && this.data.unloadingLocation) {
        const pickupDistance = parseFloat(this.data.pickupDistance);
        const deliveryDistance = parseFloat(this.data.deliveryDistance);
        const pickupCost = this.calculateDeliveryCost(this.data.weight, pickupDistance);
        const deliveryCost = this.calculateDeliveryCost(this.data.weight, deliveryDistance);
        
        this.setData({
          pickupPrice: pickupCost.toString(),
          deliveryPrice: deliveryCost.toString()
        });
      }
      this.calculateSuggestPrice();
    });
  },

  decreaseWeight() {
    this.setData({
      weight: Math.max(0.1, this.data.weight - 0.1)
    }, () => {
      if (this.data.loadingLocation && this.data.unloadingLocation) {
        const pickupDistance = parseFloat(this.data.pickupDistance);
        const deliveryDistance = parseFloat(this.data.deliveryDistance);
        const pickupCost = this.calculateDeliveryCost(this.data.weight, pickupDistance);
        const deliveryCost = this.calculateDeliveryCost(this.data.weight, deliveryDistance);
        
        this.setData({
          pickupPrice: pickupCost.toString(),
          deliveryPrice: deliveryCost.toString()
        });
      }
      this.calculateSuggestPrice();
    });
  },

  increaseTotalQuote() {
    this.setData({
      suggestPrice: (parseInt(this.data.suggestPrice) + 100).toString()
    }, () => {
      this.calculateSuggestPrice();
    });
  },

  decreaseTotalQuote() {
    this.setData({
      suggestPrice: Math.max(0, parseInt(this.data.suggestPrice) - 100).toString()
    }, () => {
      this.calculateSuggestPrice();
    });
  },

  increasePalletCount() {
    this.setData({
      palletCount: this.data.palletCount + 1
    }, () => {
      this.calculateSuggestPrice();
    });
  },

  decreasePalletCount() {
    this.setData({
      palletCount: Math.max(0, this.data.palletCount - 1)
    }, () => {
      this.calculateSuggestPrice();
    });
  },

  // 显示提货路线
  showPickupRoute() {
    wx.navigateTo({
      url: `/pages/estimate/map?type=pickup&start=${this.data.origin.name}&end=${this.data.loadingAddress}&startLat=${this.data.origin.lat}&startLng=${this.data.origin.lng}&endLat=${this.data.loadingLocation.latitude}&endLng=${this.data.loadingLocation.longitude}&weight=${this.data.weight}`,
      events: {
        calculateCost: (res) => {
          this.setData({
            pickupPrice: res.cost.toString()
          }, () => {
            this.calculateSuggestPrice();
          });
        }
      }
    });
  },

  // 显示送货路线
  showDeliveryRoute() {
    wx.navigateTo({
      url: `/pages/estimate/map?type=delivery&start=${this.data.destination.name}&end=${this.data.unloadingAddress}&startLat=${this.data.destination.lat}&startLng=${this.data.destination.lng}&endLat=${this.data.unloadingLocation.latitude}&endLng=${this.data.unloadingLocation.longitude}&weight=${this.data.weight}`,
      events: {
        calculateCost: (res) => {
          this.setData({
            deliveryPrice: res.cost.toString()
          }, () => {
            this.calculateSuggestPrice();
          });
        }
      }
    });
  },

  onBack() {
    wx.navigateBack();
  },

  // 吨位变化
  onWeightChange(event) {
    const weight = event.detail;
    this.setData({ weight }, () => {
      if (this.data.loadingLocation && this.data.unloadingLocation) {
        const pickupDistance = parseFloat(this.data.pickupDistance);
        const deliveryDistance = parseFloat(this.data.deliveryDistance);
        const pickupCost = this.calculateDeliveryCost(this.data.weight, pickupDistance);
        const deliveryCost = this.calculateDeliveryCost(this.data.weight, deliveryDistance);
        
        this.setData({
          pickupPrice: pickupCost.toString(),
          deliveryPrice: deliveryCost.toString()
        });
      }
      this.calculateSuggestPrice();
    });
  },

  // 打托数变化
  onPalletCountChange(event) {
    this.setData({
      palletCount: event.detail
    }, () => {
      this.calculateSuggestPrice();
    });
  }
}); 