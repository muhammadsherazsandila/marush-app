import React from 'react';
import { Text, View, useWindowDimensions, Platform } from 'react-native';
import { ShieldCheck, Sparkles } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { MarushLogo } from './MarushLogo';

export const Navbar: React.FC = () => {
  const { width } = useWindowDimensions();
  const isCompact = width < 480;
  const isMobile = width < 700;

  return (
    <View className="border-b border-marush-border bg-white">
      <View
        className={`mx-auto w-full max-w-[1480px] flex-row items-center justify-between ${
          isCompact ? 'min-h-[68px] gap-2 px-4 py-2.5' : isMobile ? 'min-h-[72px] gap-3 px-5 py-3' : 'min-h-[78px] gap-4 px-8 py-3.5'
        }`}
      >
        <View className={`${isCompact ? 'gap-2.5' : 'gap-3.5'} min-w-0 flex-1 flex-row items-center`}>
          <MarushLogo size="nav" variant="mark" framed={false} />
          <View className="min-w-0">
            <View className="flex-row items-center gap-1.5">
              <Text className={`${isCompact ? 'text-[13px] tracking-[1.5px]' : 'text-[14px] tracking-[1.8px]'} font-black text-marush-primary`}>
                MARUSH
              </Text>
              <View className="rounded-full bg-marush-primary-subtle px-1.5 py-0.5">
                <Text className="text-[9px] font-bold text-marush-primary tracking-wider">CEVA</Text>
              </View>
            </View>
            {!isCompact ? (
              <Text className="text-[10px] font-medium tracking-tight text-marush-muted">
                Poultry Health & Monitoring
              </Text>
            ) : (
              <Text className="text-[9px] font-medium tracking-tight text-marush-muted">
                Poultry health
              </Text>
            )}
          </View>
        </View>

        <View className={`${isCompact ? 'gap-1.5 px-3 py-2' : 'gap-2 px-3.5 py-2'} flex-row items-center rounded-full border border-marush-border bg-marush-subtle`}>
          <ShieldCheck size={isCompact ? 16 : 15} color={Colors.primary} strokeWidth={2.2} />
          {!isCompact ? (
            <Text className="text-[11px] font-semibold tracking-wide text-marush-primary">
              Enterprise Secure
            </Text>
          ) : (
            <Text className="text-[10px] font-semibold text-marush-primary">Live</Text>
          )}
        </View>
      </View>
    </View>
  );
};
