import React from 'react';
import { Text, View, useWindowDimensions, Platform } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { MarushLogo } from './MarushLogo';

export const Navbar: React.FC = () => {
  const { width } = useWindowDimensions();
  const isCompact = width < 480;
  const isMobile = width < 700;

  return (
    <View
      className="border-b border-black/[0.06] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
      style={Platform.OS === 'web' ? ({ backdropFilter: 'blur(12px)', userSelect: 'none' } as any) : {}}
    >
      <View
        className={`mx-auto w-full max-w-[1440px] flex-row items-center justify-between ${
          isCompact ? 'min-h-[64px] px-4 py-2.5' : isMobile ? 'min-h-[70px] px-6 py-3' : 'min-h-[74px] px-8 py-3'
        }`}
      >
        {/* Brand & Identity */}
        <View className="flex-1 flex-row items-center gap-3 min-w-0">
          <MarushLogo size="nav" variant="mark" framed={false} />
          <View className="min-w-0 justify-center">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-[14px] font-black tracking-[1.8px] text-marush-primary">
                MARUSH
              </Text>
              <View className="rounded-full border border-marush-primary/15 bg-marush-primary-subtle px-2 py-0.5">
                <Text className="text-[9px] font-extrabold tracking-wider text-marush-primary">CEVA</Text>
              </View>
            </View>
            <Text className="text-[11px] font-medium tracking-tight text-slate-500">
              {isCompact ? 'Poultry Health' : 'Poultry Health & Monitoring'}
            </Text>
          </View>
        </View>

        {/* Security & Status Pill */}
        <View className="flex-row items-center gap-2 rounded-full border border-black/[0.07] bg-slate-50/90 px-3.5 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <View className="relative flex-row items-center">
            <View className="h-2 w-2 rounded-full bg-emerald-500" />
            <View className="absolute -inset-0.5 rounded-full bg-emerald-500/30" />
          </View>
          <ShieldCheck size={14} color={Colors.primary} strokeWidth={2.2} />
          {!isCompact ? (
            <Text className="text-[11px] font-bold tracking-tight text-marush-primary">
              Enterprise Secure
            </Text>
          ) : (
            <Text className="text-[10px] font-bold text-marush-primary">Live</Text>
          )}
        </View>
      </View>
    </View>
  );
};
