// pages/profile/index.js
import { logout } from '../../services/auth';

Page({

    /**
     * 页面的初始数据
     */
    data: {
        userInfo: null,
        hasUserInfo: false,
        canIUseGetUserProfile: false,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 从本地存储获取用户信息
        const userInfo = wx.getStorageSync('userInfo');
        this.setData({ userInfo });
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
        // 每次显示页面时刷新用户信息
        const userInfo = wx.getStorageSync('userInfo');
        this.setData({ userInfo });
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    },

    async onLogout() {
        try {
            wx.showLoading({ title: '正在退出...' });
            
            await logout();
            
            wx.showToast({
                title: '已退出登录',
                icon: 'success'
            });

            // 跳转到登录页
            setTimeout(() => {
                wx.reLaunch({
                    url: '/pages/login/index'
                });
            }, 1500);

        } catch (error) {
            console.error('退出登录失败:', error);
            wx.showToast({
                title: error.message || '退出失败',
                icon: 'none'
            });
        } finally {
            wx.hideLoading();
        }
    }
})