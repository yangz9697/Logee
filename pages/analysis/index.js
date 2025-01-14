// pages/analysis/index.js
import { getLinesCapacity } from '../../services/routes';

Page({

    /**
     * 页面的初始数据
     */
    data: {
        loading: false,
        lines: []
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        this.loadCapacityData();
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
        this.loadCapacityData();
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

    async loadCapacityData() {
        try {
            this.setData({ loading: true });
            const data = await getLinesCapacity();
            const lines = data || [];
            this.setData({ lines });
        } catch (error) {
            console.error('加载仓位数据失败:', error);
            wx.showToast({
                title: error.message || '加载失败',
                icon: 'none'
            });
        } finally {
            this.setData({ loading: false });
            wx.stopPullDownRefresh();
        }
    }
})