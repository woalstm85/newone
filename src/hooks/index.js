// hooks/index.js - 모든 커스텀 훅을 한번에 export

export { 
  default as useApi, 
  useInventoryApi, 
  useAuthApi
} from './useApi';

export { default as useErrorHandler } from './useErrorHandler';

// 다른 커스텀 훅들도 여기에 추가할 수 있습니다
// export { useLocalStorage } from './useLocalStorage';
// export { useDebounce } from './useDebounce';
