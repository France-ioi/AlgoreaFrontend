export const isOpenerWindow = (window: Window, opener: unknown): opener is Window => String(window) === String(opener);

export const isWindowProfileUpdate = (windowName: string): boolean => windowName === 'updateProfileWindow';

export const notifyWindowOpener = (windowOpener: Window): boolean => windowOpener.dispatchEvent(new Event('profileUpdated'));
