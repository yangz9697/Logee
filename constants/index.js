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

const STATIONS = {
  startPoints: {
    '京东南京转运中心': null,
    '常州嘉民物流中心': null
  },
  endPoints: {
    '广州君建零部件产业园': null,
    '成都经开区南五路与车城西一路交叉口': null
  }
};

module.exports = {
  MOCK_RESPONSE,
  STATIONS
}; 