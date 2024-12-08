module.exports = {
  getSystemInfo() {
    const systemInfo = wx.getSystemInfoSync();
    const safeArea = systemInfo.safeArea;
    const screenHeight = systemInfo.screenHeight;
    
    return {
      safeAreaTop: safeArea.top,
      safeAreaBottom: screenHeight - safeArea.bottom
    };
  }
}; 