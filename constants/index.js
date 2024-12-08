const MOCK_RESPONSE = {
  cargoName: '电子产品',
  packageType: '纸箱',
  volume: '2方',
  weight: 5,
  vehicleLength: '6.8米',
  palletCount: 0,
  loadingAddress: '广州市天河区天河路123号',
  unloadingAddress: '深圳市南山区科技园456号',
  pickupDistance: '3.5公里',
  deliveryDistance: '5.2公里',
  pickupPrice: 50,
  deliveryPrice: 80,
  transitPrice: 100,
  origin: {
    name: '广州站',
    lat: 23.137903,
    lng: 113.327174
  },
  destination: {
    name: '深圳站',
    lat: 22.543527,
    lng: 114.057939
  }
};

// 用于控制是否使用mock数据的开关
const USE_MOCK = false;

module.exports = {
  MOCK_RESPONSE,
  USE_MOCK
}; 