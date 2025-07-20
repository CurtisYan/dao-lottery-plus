import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string, length: number = 4): string {
  if (!address) return ''
  return `${address.slice(0, 2 + length)}...${address.slice(-length)}`
}

export function formatNumber(num: number | string, decimals = 2): string {
  const number = typeof num === 'string' ? parseFloat(num) : num
  
  // 处理大数字的缩写
  let result: number;
  let suffix = '';
  
  if (number >= 1e9) {
    result = number / 1e9;
    suffix = 'B';
  } else if (number >= 1e6) {
    result = number / 1e6;
    suffix = 'M';
  } else if (number >= 1e3) {
    result = number / 1e3;
    suffix = 'K';
  } else {
    result = number;
  }
  
  // 检查是否有小数部分
  const hasDecimal = result % 1 !== 0;
  
  // 如果没有小数部分，返回整数；如果有，则保留指定位数的小数
  if (hasDecimal) {
    return result.toFixed(decimals) + suffix;
  } else {
    return Math.floor(result) + suffix;
  }
}

export function formatEther(wei: bigint | string, decimals = 4): string {
  if (!wei) return '0';
  
  try {
    const value = typeof wei === 'string' ? BigInt(wei) : wei;
    const ether = Number(value) / 1e18;
    
    // 检查是否有小数部分
    const hasDecimal = ether % 1 !== 0;
    
    // 如果没有小数部分，返回整数；如果有，则保留指定位数的小数
    if (hasDecimal) {
      // 对于非常小的数值，保留更多小数位
      if (ether < 0.0001) {
        return ether.toFixed(decimals);
      }
      
      // 移除末尾的0
      return ether.toFixed(decimals).replace(/\.?0+$/, '');
    } else {
      return Math.floor(ether).toString();
    }
  } catch (error) {
    console.error('formatEther error:', error);
    return '0';
  }
} 