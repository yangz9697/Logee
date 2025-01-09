export const formatTimestamp = (timestamp, format = 'YYYY-MM-DD HH:mm') => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
};

// 转换为时间戳
export const parseDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  return new Date(dateTimeStr).getTime();
}; 