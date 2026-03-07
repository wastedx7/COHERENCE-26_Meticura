import en from './en';
import hi from './hi';
import ta from './ta';
import te from './te';
import bn from './bn';
import mr from './mr';
import kn from './kn';
import gu from './gu';

export type TranslationKey = keyof typeof en;

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
];

export const translations: Record<string, Record<string, string>> = {
  en,
  hi,
  ta,
  te,
  bn,
  mr,
  kn,
  gu,
};
