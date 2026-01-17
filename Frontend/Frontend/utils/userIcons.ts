// Helper function to get user icon source
export const getUserIconSource = (iconFilename: string | null) => {
  const defaultIcon = require('@/assets/user icons/Screenshot 2026-01-16 at 10.39.44ΓÇ»PM.png');
  if (!iconFilename) return defaultIcon;
  
  // Map icon filenames to require statements (React Native requires static requires)
  const iconMap: { [key: string]: any } = {
    'Screenshot 2026-01-16 at 10.39.44ΓÇ»PM.png': require('@/assets/user icons/Screenshot 2026-01-16 at 10.39.44ΓÇ»PM.png'),
    'Screenshot 2026-01-16 at 10.39.51ΓÇ»PM.png': require('@/assets/user icons/Screenshot 2026-01-16 at 10.39.51ΓÇ»PM.png'),
    'Screenshot 2026-01-16 at 10.40.00ΓÇ»PM.png': require('@/assets/user icons/Screenshot 2026-01-16 at 10.40.00ΓÇ»PM.png'),
    'Screenshot 2026-01-16 at 10.40.19ΓÇ»PM.png': require('@/assets/user icons/Screenshot 2026-01-16 at 10.40.19ΓÇ»PM.png'),
    'Screenshot 2026-01-16 at 10.40.26ΓÇ»PM.png': require('@/assets/user icons/Screenshot 2026-01-16 at 10.40.26ΓÇ»PM.png'),
    'Screenshot 2026-01-16 at 10.40.41ΓÇ»PM.png': require('@/assets/user icons/Screenshot 2026-01-16 at 10.40.41ΓÇ»PM.png'),
    'Screenshot 2026-01-16 at 10.41.02ΓÇ»PM.png': require('@/assets/user icons/Screenshot 2026-01-16 at 10.41.02ΓÇ»PM.png'),
    'Screenshot 2026-01-16 at 10.41.09ΓÇ»PM.png': require('@/assets/user icons/Screenshot 2026-01-16 at 10.41.09ΓÇ»PM.png'),
    'Screenshot 2026-01-16 at 10.41.17ΓÇ»PM.png': require('@/assets/user icons/Screenshot 2026-01-16 at 10.41.17ΓÇ»PM.png'),
    'Screenshot 2026-01-16 at 10.41.54ΓÇ»PM.png': require('@/assets/user icons/Screenshot 2026-01-16 at 10.41.54ΓÇ»PM.png'),
  };
  
  return iconMap[iconFilename] || defaultIcon;
};
