// pages/routes/index.js
import { getRoutes, deleteRoute, updateLinePrice, updateLineStatus } from '../../services/routes';
import Dialog from '@vant/weapp/dialog/dialog';

Page({

    /**
     * 页面的初始数据
     */
    data: {
        routes: [],
        loading: false,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
        this.loadRoutes();
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
        this.loadRoutes();
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

    async loadRoutes() {
        try {
            this.setData({ loading: true });
            const routes = await getRoutes();
            this.setData({ 
                routes: routes.map(route => ({
                    ...route,
                    endSites: route.endSites.map(site => ({
                        ...site,
                        disabled: !site.enabled
                    }))
                }))
            });
        } catch (error) {
            console.error('加载线路列表失败:', error);
            wx.showToast({
                title: error.message || '加载失败',
                icon: 'none'
            });
        } finally {
            this.setData({ loading: false });
        }
    },

    onAddRoute() {
        wx.navigateTo({
            url: '/pages/routes/edit'
        });
    },

    onEditRoute(e) {
        const { id } = e.currentTarget.dataset;
        wx.navigateTo({
            url: `/pages/routes/edit?id=${id}`
        });
    },

    async onDeleteRoute() {
        const { selectedEndSite } = this.data;
        if (!selectedEndSite) return;

        try {
            const res = await wx.showModal({
                title: '确认删除',
                content: `确定要删除此线路吗？`,
                confirmText: '删除',
                confirmColor: '#ee0a24'
            });

            if (res.confirm) {
                wx.showLoading({ title: '删除中...' });
                await deleteRoute(selectedEndSite.id);
                await this.loadRoutes();
                
                wx.showToast({
                    title: '删除成功',
                    icon: 'success'
                });
            }
        } catch (error) {
            console.error('删除线路失败:', error);
            wx.showToast({
                title: error.message || '删除失败',
                icon: 'none'
            });
        } finally {
            wx.hideLoading();
        }
    },

    onStartSiteChange(e) {
        const { site } = e.currentTarget.dataset;
        const firstEndSite = site?.endSites[0];
        this.setData({ 
            selectedStartSite: site,
            selectedEndSite: firstEndSite
        });
    },

    onEndSiteChange(e) {
        const { site } = e.currentTarget.dataset;
        this.setData({ selectedEndSite: site });
    },

    async onPriceChange(e) {
        const value = Number(e.detail.value);
        if (isNaN(value) || value <= 0) {
            wx.showToast({
                title: '请输入有效的运价',
                icon: 'none'
            });
            return;
        }
        
        const { selectedStartSite, selectedEndSite } = this.data;
        try {
            await updateLinePrice(selectedEndSite.id, {
                price: value,
                capacity: selectedEndSite.capacity
            });
            
            // 更新本地数据
            const endSite = selectedStartSite.endSites.find(
                site => site.site.id === selectedEndSite.site.id
            );
            endSite.price = value;
            
            this.setData({
                selectedEndSite: endSite,
                routes: this.data.routes
            });

            wx.showToast({
                title: '更新成功',
                icon: 'success'
            });
        } catch (error) {
            console.error('更新运价失败:', error);
            wx.showToast({
                title: error.message || '更新失败',
                icon: 'none'
            });
        }
    },

    async onCapacityChange(e) {
        const value = Number(e.detail.value);
        if (isNaN(value) || value <= 0) {
            wx.showToast({
                title: '请输入有效的仓位',
                icon: 'none'
            });
            return;
        }
        
        const { selectedStartSite, selectedEndSite } = this.data;
        try {
            await updateLinePrice(selectedEndSite.id, {
                price: selectedEndSite.price,
                capacity: value
            });
            
            // 更新本地数据
            const endSite = selectedStartSite.endSites.find(
                site => site.site.id === selectedEndSite.site.id
            );
            endSite.capacity = value;
            
            this.setData({
                selectedEndSite: endSite,
                routes: this.data.routes
            });

            wx.showToast({
                title: '更新成功',
                icon: 'success'
            });
        } catch (error) {
            console.error('更新仓位失败:', error);
            wx.showToast({
                title: error.message || '更新失败',
                icon: 'none'
            });
        }
    },

    async onToggleLine(e) {
        const { routeIndex, lineIndex } = e.currentTarget.dataset;
        const line = this.data.routes[routeIndex].endSites[lineIndex];
        const enabled = e.detail;
        console.log(line, enabled);
        try {
            await updateLineStatus(line.id, { enabled });
            
            // 更新本地数据
            this.setData({
                [`routes[${routeIndex}].endSites[${lineIndex}].disabled`]: !enabled
            });

            wx.showToast({
                title: enabled ? '已启用' : '已禁用',
                icon: 'success'
            });
        } catch (error) {
            console.error('更新状态失败:', error);
            wx.showToast({
                title: error.message || '操作失败',
                icon: 'none'
            });
        }
    },

    onDeleteLine(e) {
        const { routeIndex, lineIndex } = e.currentTarget.dataset;
        const line = this.data.routes[routeIndex].endSites[lineIndex];
        
        Dialog.confirm({
            title: '确认删除',
            message: `确定要删除 ${this.data.routes[routeIndex].startSite.name} → ${line.site.name} 线路吗？`,
        }).then(async () => {
            try {
                await deleteRoute(line.id);
                
                // 更新本地数据
                const routes = [...this.data.routes];
                routes[routeIndex].endSites.splice(lineIndex, 1);
                this.setData({ routes });

                wx.showToast({
                    title: '删除成功',
                    icon: 'success'
                });
            } catch (error) {
                console.error('删除失败:', error);
                wx.showToast({
                    title: error.message || '删除失败',
                    icon: 'none'
                });
            }
        });
    },

    onEditLine(e) {
        const { routeIndex, lineIndex } = e.currentTarget.dataset;
        const route = this.data.routes[routeIndex];
        const line = route.endSites[lineIndex];
        
        wx.navigateTo({
            url: `/pages/routes/edit?id=${line.id}&startSiteId=${route.startSite.id}&endSiteId=${line.site.id}`
        });
    },

    // 阻止switch点击事件冒泡
    onSwitchTap(e) {
        if (e && e.stopPropagation) {
            e.stopPropagation();
        }
        return false;  // 返回 false 也可以阻止冒泡
    }
})