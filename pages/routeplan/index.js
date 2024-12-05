const mp = require('miniprogram-render')
const getBaseConfig = require('../base.js')
const config = require('../../config')

function init(window, document) {require('../../common/chunk-vendors.js')(window, document);require('../../common/routeplan.js')(window, document)}

const baseConfig = getBaseConfig(mp, config, init)

// Mock 数据
const MOCK_RESPONSE = {
    loadingAddress: '上海市浦东新区张江高科技园区',
    startStation: '上海张江物流中心',
    pickupDistance: '3.5公里',
    pickupPrice: '¥150',
    pickupTruckInfo: '4.2米厢式货车',
    unloadingAddress: '江苏省苏州市工业园区',
    destinationStation: '苏州工业园区物流中心',
    deliveryDistance: '5.2公里',
    deliveryPrice: '¥180',
    deliveryTruckInfo: '4.2米厢式货车',
    weight: 5,
    cargoName: '电子设备',
    packageType: '木箱',
    volume: '10方',
    remark: '易碎品，小心轻放'
};

Page({
    ...baseConfig.base,
    data: {
        ...baseConfig.base.data,
        pageId: '',
        bodyClass: '',
        bodyStyle: '',
        tempImagePath: '',
        hasImageInfo: false,
        loadingAddress: '',
        startStation: '',
        pickupDistance: '',
        pickupPrice: '',
        pickupTruckInfo: '',
        unloadingAddress: '',
        destinationStation: '',
        deliveryDistance: '',
        deliveryPrice: '',
        deliveryTruckInfo: '',
        loadingText: '加载中...',
        pageStatus: 'loading',
        windowWidth: 375,
        windowHeight: 667,
        transitPrice: 100, // 干线联运价格，默认100元/吨
        weight: 5, // 货物重量，默认5吨
        totalPrice: 0, // 总价
        safeAreaTop: 0,    // 顶部安全距离
        safeAreaBottom: 0,  // 底部安全距离
        cargoName: '',
        packageType: '',
        volume: '',
        remark: ''
    },

    ...baseConfig.methods,
    
    onLoad(query) {
        if (baseConfig.base.onLoad) {
            baseConfig.base.onLoad.call(this, query);
        }
        // 获取系统信息设置安全距离
        this.setSystemInfo();
        // 默认加载 mock 数据
        this.updateImageInfo(MOCK_RESPONSE);
    },

    // 获取系统信息
    setSystemInfo() {
        const systemInfo = wx.getSystemInfoSync();
        const safeArea = systemInfo.safeArea;
        const screenHeight = systemInfo.screenHeight;
        
        this.setData({
            safeAreaTop: safeArea.top,
            safeAreaBottom: screenHeight - safeArea.bottom
        });
    },

    onReady() {
        if (baseConfig.base.onReady) {
            baseConfig.base.onReady.call(this);
        }
    },

    chooseImage() {
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success: (res) => {
                const tempFilePath = res.tempFiles[0].tempFilePath;
                this.setData({
                    tempImagePath: tempFilePath
                });
                
                // 模拟上传延迟
                this.mockUploadAndAnalyze();
            },
            fail: (err) => {
                wx.showToast({
                    title: '选择图片失败',
                    icon: 'none'
                });
            }
        });
    },

    // 模拟上传和分析过程
    mockUploadAndAnalyze() {
        wx.showLoading({
            title: '正在识别中...'
        });

        // 模拟网络请求延迟
        setTimeout(() => {
            wx.hideLoading();
            this.updateImageInfo(MOCK_RESPONSE);
            
            wx.showToast({
                title: '识别成功',
                icon: 'success'
            });
        }, 1500); // 延迟1.5秒
    },

    // 保留原有的上传方法，以备后续接入真实接口
    uploadAndAnalyzeImage(filePath) {
        wx.showLoading({
            title: '正在识别中...'
        });
        const uploadUrl = 'YOUR_API_ENDPOINT';
        wx.uploadFile({
            url: uploadUrl,
            filePath: filePath,
            name: 'image',
            success: (res) => {
                try {
                    const result = JSON.parse(res.data);
                    this.updateImageInfo(result);
                } catch (error) {
                    wx.showToast({
                        title: '解析数据失败',
                        icon: 'none'
                    });
                }
            },
            fail: (err) => {
                wx.showToast({
                    title: '上传失败',
                    icon: 'none'
                });
            },
            complete: () => {
                wx.hideLoading();
            }
        });
    },

    updateImageInfo(data) {
        this.setData({
            hasImageInfo: true,
            loadingAddress: data.loadingAddress || '',
            startStation: data.startStation || '',
            pickupDistance: data.pickupDistance || '',
            pickupPrice: data.pickupPrice || '',
            pickupTruckInfo: data.pickupTruckInfo || '',
            unloadingAddress: data.unloadingAddress || '',
            destinationStation: data.destinationStation || '',
            deliveryDistance: data.deliveryDistance || '',
            deliveryPrice: data.deliveryPrice || '',
            deliveryTruckInfo: data.deliveryTruckInfo || '',
            weight: data.weight || 5,
            cargoName: data.cargoName || '',
            packageType: data.packageType || '',
            volume: data.volume || '',
            remark: data.remark || ''
        }, () => {
            this.calculateTotalPrice(); // 更新数据后计算总价
        });
    },

    onShow() {
        if (baseConfig.base.onShow) {
            baseConfig.base.onShow.call(this);
        }
    },

    onHide() {
        if (baseConfig.base.onHide) {
            baseConfig.base.onHide.call(this);
        }
    },

    onUnload() {
        if (baseConfig.base.onUnload) {
            baseConfig.base.onUnload.call(this);
        }
    },

    // 增加干线价格
    increasePrice() {
        const newPrice = this.data.transitPrice + 10;
        this.setData({
            transitPrice: newPrice
        });
        this.calculateTotalPrice();
    },

    // 减少干线价格
    decreasePrice() {
        const newPrice = Math.max(0, this.data.transitPrice - 10);
        this.setData({
            transitPrice: newPrice
        });
        this.calculateTotalPrice();
    },

    // 计算总价
    calculateTotalPrice() {
        const pickupPrice = parseFloat(this.data.pickupPrice?.replace('¥', '')) || 0;
        const deliveryPrice = parseFloat(this.data.deliveryPrice?.replace('¥', '')) || 0;
        const transitTotal = this.data.transitPrice * this.data.weight;
        const total = pickupPrice + deliveryPrice + transitTotal;
        
        this.setData({
            totalPrice: total.toFixed(2)
        });
    }
})
