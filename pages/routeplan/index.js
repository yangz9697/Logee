const mp = require('miniprogram-render')
const getBaseConfig = require('../base.js')
const config = require('../../config')
const AMapWX = require('../../libs/amap-wx.130.js').AMapWX;
const amapKey = 'a31e0264e499ccaf681a3df1900b0fb9';

function init(window, document) {require('../../common/chunk-vendors.js')(window, document);require('../../common/routeplan.js')(window, document)}

const baseConfig = getBaseConfig(mp, config, init)

// Mock 数据
const MOCK_RESPONSE = {
    pickupPrice: 180,
    deliveryPrice: 220,
    weight: 5,
    cargoName: '电子设备',
    packageType: '木箱',
    volume: '10方',
    truckType: '4.2米厢式货车',
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
        remark: '',
        loadingLocation: null,  // 添加装货位置信息
        unloadingLocation: null,  // 添加卸货位置信息
        selectedStartPoint: '',  // 选中的始发点
        selectedEndPoint: '',    // 选中的目标站点
        // 预设的站点信息
        stations: {
            startPoints: {
                '京东南京转运中心': null,  // 经纬度信息将在初始化时获取
                '常州嘉民物流中心': null
            },
            endPoints: {
                '广州君建零部件产业园': null,
                '成都经开区南五路与车城西一路交叉口': null
            }
        }
    },

    ...baseConfig.methods,
    
    onLoad(query) {
        if (baseConfig.base.onLoad) {
            baseConfig.base.onLoad.call(this, query);
        }
        this.setSystemInfo();
        
        // 初始化所有站点的经纬度信息
        this.initStationLocations();
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
        if (!this.data.selectedStartPoint || !this.data.selectedEndPoint) {
            wx.showToast({
                title: '请先选择站点',
                icon: 'none'
            });
            return;
        }
        wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success: (res) => {
                const tempFilePath = res.tempFiles[0].tempFilePath;
                this.setData({
                    tempImagePath: tempFilePath
                });
                
                // 直接调用OCR识别
                this.recognizeImage(tempFilePath);
            },
            fail: (err) => {
                wx.showToast({
                    title: '选择图片失败',
                    icon: 'none'
                });
            }
        });
    },

    // OCR识别方法
    recognizeImage(filePath) {
        wx.showLoading({
            title: '正在识别中...'
        });

        // 将图片转为 base64
        wx.getFileSystemManager().readFile({
            filePath: filePath,
            encoding: 'base64',
            success: (res) => {
                // 调用通用印刷体OCR
                wx.serviceMarket.invokeService({
                    service: 'wx79ac3de8be320b71',
                    api: 'OcrAllInOne',
                    data: {
                        img_data: res.data,      // 使用 img_data 字段
                        data_type: 2,            // 2：base64字符串
                        ocr_type: 8              // 8：通用OCR
                    },
                    success: (res) => {
                        console.log('OCR识别结果:', res);
                        this.parseOcrResult(res.data);
                    },
                    fail: (err) => {
                        console.error('OCR识别失败:', err);
                        wx.showToast({
                            title: '识别失败',
                            icon: 'none'
                        });
                    },
                    complete: () => {
                        wx.hideLoading();
                    }
                });
            },
            fail: (err) => {
                console.error('读取图片失败:', err);
                wx.hideLoading();
                wx.showToast({
                    title: '读取图片失败',
                    icon: 'none'
                });
            }
        });
    },

    // 解析OCR结果
    parseOcrResult(ocrData) {
        try {
            console.log('OCR识别结果:', ocrData);
            const result = ocrData?.ocr_comm_res;
            if (!result.items || !result.items.length) {
                throw new Error('No text found');
            }

            // 只提取 text 字段并用换行符拼接
            const allText = result.items
                .map(item => item.text)
                .filter(text => text)
                .join('\n');
                
            console.log('提取的文字:', allText);
            
            // 调用 Coze 工作流
            this.callCozeWorkflow(allText);

        } catch (error) {
            console.error('解析OCR结果失败:', error);
            wx.showToast({
                title: '解析失败',
                icon: 'none'
            });
        }
    },

    // ��用 Coze 工作流
    async callCozeWorkflow(text) {
        try {
            const response = await new Promise((resolve, reject) => {
                wx.request({
                    url: 'https://api.coze.cn/v1/workflow/run',
                    method: 'POST',
                    header: {
                        'Authorization': 'Bearer pat_lZ2zkZyuZuJjZiPm928zskjhRP22UKOtQtSRZPQhpW0fNH8i6mM7O4eSf0QplUnO',
                        'Content-Type': 'application/json'
                    },
                    data: {
                        workflow_id: '7444842047746719779',
                        parameters: {
                            BOT_USER_INPUT: text
                        }
                    },
                    success: resolve,
                    fail: reject
                });
            });

            console.log('Coze工作流调用结果:', response);

            if (response.statusCode === 200 && response.data.code === 0) {
                const result = JSON.parse(response.data.data);
                console.log('解析后的结果:', result.output);
                
                // 从 output 中获取地址信息，使用正确的字段名
                const { loading_place, unloading_place } = result.output;
                console.log('装货地址:', loading_place);
                console.log('卸货地址:', unloading_place);
                
                if (loading_place && unloading_place) {
                    await this.getAccurateLocations(loading_place, unloading_place);
                } else {
                    throw new Error('未能识别出地址信息');
                }
            } else {
                throw new Error(response.data?.msg || '工作流调用失败');
            }
        } catch (error) {
            console.error('Coze工作流调用失败:', error);
            wx.showToast({
                title: error.message || '识别失败',
                icon: 'none'
            });
            
            // 暂时使用 mock 数据
            this.updateImageInfo(MOCK_RESPONSE);
        }
    },

    // 获取精确地址信息
    async getAccurateLocations(loadingAddress, unloadingAddress) {
        try {
            const myAmapFun = new AMapWX({ key: amapKey });
            
            // 获取装货地址经纬度
            const loadingLocation = await this.getLocationByAddress(myAmapFun, loadingAddress);
            const unloadingLocation = await this.getLocationByAddress(myAmapFun, unloadingAddress);

            // 获取选中的站点位置
            const startPoint = this.data.stations.startPoints[this.data.selectedStartPoint];
            const endPoint = this.data.stations.endPoints[this.data.selectedEndPoint];

            if (!startPoint || !endPoint) {
                throw new Error('站点位置信息未准备好');
            }

            // 计算提货距离
            const pickupDistance = await this.calculateRouteDistance(
                myAmapFun,
                startPoint,
                loadingLocation
            );

            // 计算送货距离
            const deliveryDistance = await this.calculateRouteDistance(
                myAmapFun,
                endPoint,
                unloadingLocation
            );

            // 更新页面数据
            this.updateImageInfo({
                ...MOCK_RESPONSE,
                loadingAddress,
                unloadingAddress,
                loadingLocation,
                unloadingLocation,
                pickupDistance: `${pickupDistance}公里`,
                deliveryDistance: `${deliveryDistance}公里`
            });

        } catch (error) {
            console.error('获取地址经纬度失败:', error);
            wx.showToast({
                title: error.message || '地址解析失败',
                icon: 'none'
            });
            
            // 发生错误时也更新页面数据，但不包含距离信息
            this.updateImageInfo({
                ...MOCK_RESPONSE,
                loadingAddress,
                unloadingAddress,
                loadingLocation: null,
                unloadingLocation: null
            });
        }
    },

    // 根据地址获取位置信息
    getLocationByAddress(amapFun, address) {
        return new Promise((resolve, reject) => {
            amapFun.getInputtips({
                keywords: address,
                location: '',
                success: (data) => {
                    if (data && data.tips && data.tips.length > 0) {
                        const firstTip = data.tips[0];
                        if (firstTip.location) {
                            const [longitude, latitude] = firstTip.location.split(',');
                            resolve({
                                address,
                                longitude: parseFloat(longitude),
                                latitude: parseFloat(latitude)
                            });
                        } else {
                            reject(new Error(`无法获取 ${address} 的经纬度`));
                        }
                    } else {
                        reject(new Error(`未找到 ${address} 的位置信息`));
                    }
                },
                fail: reject
            });
        });
    },

    // 计算两点间的实际行驶距离
    calculateRouteDistance(amapFun, start, end) {
        if (!start || !end || !start.longitude || !end.longitude) {
            return Promise.reject(new Error('位置信息不完整'));
        }

        return new Promise((resolve, reject) => {
            amapFun.getDrivingRoute({
                origin: `${start.longitude},${start.latitude}`,
                destination: `${end.longitude},${end.latitude}`,
                success: (data) => {
                    if (data.paths && data.paths[0] && data.paths[0].distance) {
                        // 转换为公里并保留一位小数
                        const distance = (data.paths[0].distance / 1000).toFixed(1);
                        resolve(distance);
                    } else {
                        reject(new Error('无法计算路线距离'));
                    }
                },
                fail: reject
            });
        });
    },

    updateImageInfo(data) {
        this.setData({
            hasImageInfo: true,
            loadingAddress: data.loadingAddress || '',
            startStation: this.data.selectedStartPoint,
            unloadingAddress: data.unloadingAddress || '',
            destinationStation: this.data.selectedEndPoint,
            pickupDistance: data.pickupDistance || '',
            deliveryDistance: data.deliveryDistance || '',
            pickupPrice: MOCK_RESPONSE.pickupPrice,
            deliveryPrice: MOCK_RESPONSE.deliveryPrice,
            weight: MOCK_RESPONSE.weight,
            cargoName: MOCK_RESPONSE.cargoName,
            packageType: MOCK_RESPONSE.packageType,
            volume: MOCK_RESPONSE.volume,
            truckType: MOCK_RESPONSE.truckType,
            remark: MOCK_RESPONSE.remark,
            loadingLocation: data.loadingLocation || null,
            unloadingLocation: data.unloadingLocation || null
        }, () => {
            this.calculateTotalPrice();
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
    },

    // 显示提货路线
    showPickupRoute() {
        if (!this.data.hasImageInfo) return;
        if (!this.data.loadingLocation) {
            wx.showToast({
                title: '装货地址未解析',
                icon: 'none'
            });
            return;
        }
        
        // 获取始发站点的位置信息
        const startLocation = this.data.stations.startPoints[this.data.selectedStartPoint];
        if (!startLocation) {
            wx.showToast({
                title: '始发站点位置未获取',
                icon: 'none'
            });
            return;
        }

        wx.navigateTo({
            url: `/pages/routeplan/map?type=pickup&start=${this.data.startStation}&end=${this.data.loadingAddress}&startLat=${startLocation.latitude}&startLng=${startLocation.longitude}&endLat=${this.data.loadingLocation.latitude}&endLng=${this.data.loadingLocation.longitude}`
        });
    },

    // 显示送货路线
    showDeliveryRoute() {
        if (!this.data.hasImageInfo) return;
        if (!this.data.unloadingLocation) {
            wx.showToast({
                title: '卸货地址未解析',
                icon: 'none'
            });
            return;
        }

        // 获取目标站点的位置信息
        const endLocation = this.data.stations.endPoints[this.data.selectedEndPoint];
        if (!endLocation) {
            wx.showToast({
                title: '目标站点位置未获取',
                icon: 'none'
            });
            return;
        }

        wx.navigateTo({
            url: `/pages/routeplan/map?type=delivery&start=${this.data.destinationStation}&end=${this.data.unloadingAddress}&startLat=${endLocation.latitude}&startLng=${endLocation.longitude}&endLat=${this.data.unloadingLocation.latitude}&endLng=${this.data.unloadingLocation.longitude}`
        });
    },

    // 初始化所有站点位置信息
    async initStationLocations() {
        const myAmapFun = new AMapWX({ key: amapKey });
        
        // 获取所有始发点位置
        for (const point of Object.keys(this.data.stations.startPoints)) {
            try {
                const location = await this.getLocationByName(myAmapFun, point);
                this.setData({
                    [`stations.startPoints.${point}`]: location
                });
            } catch (error) {
                console.error(`获取始发点 ${point} 位置失败:`, error);
            }
        }
        
        // 获取所有目标站点位置
        for (const point of Object.keys(this.data.stations.endPoints)) {
            try {
                const location = await this.getLocationByName(myAmapFun, point);
                this.setData({
                    [`stations.endPoints.${point}`]: location
                });
            } catch (error) {
                console.error(`获取目标站点 ${point} 位置失败:`, error);
            }
        }
    },

    // 根据名称获取位置信息
    getLocationByName(amapFun, name) {
        return new Promise((resolve, reject) => {
            amapFun.getInputtips({
                keywords: name,
                location: '',
                success: (data) => {
                    if (data && data.tips && data.tips.length > 0) {
                        const firstTip = data.tips[0];
                        if (firstTip.location) {
                            const [longitude, latitude] = firstTip.location.split(',');
                            resolve({
                                name,
                                longitude: parseFloat(longitude),
                                latitude: parseFloat(latitude)
                            });
                        } else {
                            reject(new Error(`无法���取 ${name} 的经纬度`));
                        }
                    } else {
                        reject(new Error(`未找到 ${name} 的位置信息`));
                    }
                },
                fail: reject
            });
        });
    },

    // 选择始发点
    selectStartPoint(e) {
        const point = e.currentTarget.dataset.point;
        const location = this.data.stations.startPoints[point];
        
        this.setData({
            selectedStartPoint: point,
            startStation: point,
            loadingLocation: location,
            // 如果已经识别过图片，清相关数据
            hasImageInfo: false,
            tempImagePath: '',
            loadingAddress: '',
            unloadingAddress: '',
            // ... 清空其他相关数据
        });
    },

    // 选择目标站点
    selectEndPoint(e) {
        const point = e.currentTarget.dataset.point;
        const location = this.data.stations.endPoints[point];
        
        this.setData({
            selectedEndPoint: point,
            destinationStation: point,
            unloadingLocation: location,
            // 如果已经识别过图片，清空相关数据
            hasImageInfo: false,
            tempImagePath: '',
            loadingAddress: '',
            unloadingAddress: '',
            // ... 清空其他相关数据
        });
    }
})
