import { Share, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import ViewShot from 'react-native-view-shot';

interface ShareOptions {
  message: string;
  title?: string;
  url?: string;
}

export async function shareToSocialMedia(options: ShareOptions) {
  try {
    const result = await Share.share({
      message: options.message,
      title: options.title,
      url: options.url,
    });

    if (result.action === Share.sharedAction) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error sharing:', error);
    return false;
  }
}

export async function shareQuoteImage(uri: string, message: string) {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      throw new Error('Sharing is not available on this platform');
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: message,
    });

    return true;
  } catch (error) {
    console.error('Error sharing image:', error);
    return false;
  }
}

export async function captureAndShareQuote(ref: React.RefObject<any>, message: string) {
  try {
    const uri = await ref.current.capture();
    return shareQuoteImage(uri, message);
  } catch (error) {
    console.error('Error capturing quote:', error);
    return false;
  }
} 