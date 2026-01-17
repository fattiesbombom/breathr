import { useWindowDimensions } from 'react-native';

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  const isSmall = width < 375;
  const isMedium = width >= 375 && width < 428;
  const isShort = height < 700;
  
  return {
    width,
    height,
    isSmall,
    isMedium,
    isShort,
    buttonSize: isSmall ? 180 : isMedium ? 210 : 230,
    titleSize: isSmall ? 24 : isMedium ? 28 : 32,
    emojiSize: isSmall ? 48 : 64,
    spacing: isSmall ? 16 : 24,
    headerPadding: isShort ? 40 : 60,
  };
};
