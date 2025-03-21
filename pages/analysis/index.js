// pages/analysis/index.js
import { getFlows, followLine, unfollowLine, updateLineStatus } from '../../services/routes';

Page({

    /**
     * 页面的初始数据
     */
    data: {
        isAdmin: false,
        loading: false,
        flows: [],
        selectedLineId: null,
        currentUser: {}
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        const currentUser = wx.getStorageSync('userInfo') || {};
        const isAdmin = currentUser.roleName === '管理员';
        this.setData({ 
            currentUser,
            isAdmin
        });
        this.loadFlows();
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
        this.loadFlows().then(() => {
            wx.stopPullDownRefresh();
        });
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

    async loadFlows() {
        try {
            this.setData({ loading: true });
            const res = await getFlows();
            this.setData({ flows: res.flows });
        } catch (error) {
            console.error('加载流向列表失败:', error);
            wx.showToast({
                title: error.message || '加载失败',
                icon: 'none'
            });
        } finally {
            this.setData({ loading: false });
        }
    },

    // 关注线路
    async onFollowLine(e) {
        const { lineId } = e.currentTarget.dataset;
        try {
            await followLine(lineId);
            await this.loadFlows(); // 重新加载数据以更新关注状态
            
            wx.showToast({
                title: '关注成功',
                icon: 'success'
            });
        } catch (error) {
            console.error('关注失败:', error);
            wx.showToast({
                title: error.message || '关注失败',
                icon: 'none'
            });
        }
    },

    // 取消关注
    async onUnfollowLine(e) {
        const { lineId } = e.currentTarget.dataset;
        try {
            await unfollowLine(lineId);
            await this.loadFlows(); // 重新加载数据以更新关注状态
            
            wx.showToast({
                title: '已取消关注',
                icon: 'success'
            });
        } catch (error) {
            console.error('取消关注失败:', error);
            wx.showToast({
                title: error.message || '操作失败',
                icon: 'none'
            });
        }
    },

    // 管理员修改状态
    async onStatusChange(event) {
        const { lineId, status } = event.currentTarget.dataset;
        
        try {
            await updateLineStatus(lineId, { status });
            await this.loadFlows(); // 重新加载数据以更新状态
            
            wx.showToast({
                title: '状态更新成功',
                icon: 'success'
            });
        } catch (error) {
            console.error('更新状态失败:', error);
            wx.showToast({
                title: error.message || '更新失败',
                icon: 'none'
            });
        }
    },

    onLineClick(event) {
        const { lineId } = event.currentTarget.dataset;
        this.setData({
            selectedLineId: this.data.selectedLineId === lineId ? null : lineId
        });
    }
})