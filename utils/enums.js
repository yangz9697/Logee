import { getEnums as fetchEnums } from '../services/enums';

// 加载枚举数据
export const loadEnums = async (type) => {
  try {
    const res = await fetchEnums(type);
    return res.data;
  } catch (error) {
    console.error('获取枚举数据失败:', error);
    return null;
  }
};

// 缓存的枚举数据
let enumsCache = null;

// 获取枚举数据
export const getCachedEnums = async () => {
  if (!enumsCache) {
    enumsCache = await loadEnums();
  }
  return enumsCache;
};

export const getEnums = () => {
  return Promise.resolve({
    paymentMethod: {
      return: '回付',
      arrival: '到付'
    },
    receiptType: {
      electronic: '电子',
      paper: '纸质'
    },
    returnMethod: {
      photo: '拍照',
      mail: '邮寄'
    }
  });
}; 