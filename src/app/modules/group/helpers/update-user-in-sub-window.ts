export const subWindowUserDataUpdated = (windowName: string, callback: () => void): void => {
  if (windowName === 'updateProfileWindow') {
    callback();
  }
};

export const notifyWindowOpener = (windowOpener: Window): boolean => windowOpener.dispatchEvent(new Event('profileUpdated'));
