// admin/TabBar.tsx
import { RefreshCw } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../constants/design";
import { S } from "./styles";

export interface TabDef {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: TabDef[];
  activeTab: string;
  loading: boolean;
  onTabPress: (id: string) => void;
  onRefresh: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  loading,
  onTabPress,
  onRefresh,
}) => (
  <View style={S.tabBarWrap}>
    <View style={S.tabBarInner}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={S.tabScroll}
        style={{ flex: 1, minWidth: 0 }}
      >
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[S.tabItem, active && S.tabItemActive]}
              onPress={() => onTabPress(tab.id)}
            >
              <Text style={[S.tabItemText, active && S.tabItemTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <TouchableOpacity
        onPress={onRefresh}
        disabled={loading}
        style={S.refreshBtn}
      >
        {loading ? (
          <ActivityIndicator size="small" color={Colors.accent} />
        ) : (
          <View style={S.refreshBtnRow}>
            <RefreshCw size={15} color={Colors.accent} />
            <Text style={S.refreshBtnText}>Refresh</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  </View>
);
