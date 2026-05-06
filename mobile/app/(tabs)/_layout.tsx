import { Tabs } from 'expo-router';
import { useColorScheme, Text, Image, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/theme/ThemeContext';

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 20, color, lineHeight: 26 }}>{emoji}</Text>;
}

function ProfileIcon({ color, focused }: { color: string; focused: boolean }) {
  const { user } = useAuth();
  
  if (user?.avatar_url) {
    return (
      <View style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        overflow: 'hidden',
        borderWidth: focused ? 1.5 : 1,
        borderColor: color,
      }}>
        <Image 
          source={{ uri: user.avatar_url }} 
          style={{ width: '100%', height: '100%' }} 
          resizeMode="cover"
        />
      </View>
    );
  }

  return <TabIcon emoji="◯" color={color} />;
}

export default function TabsLayout() {
  const { t } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: t.bg,
          borderTopColor: t.ring,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.muted,
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '500',
          letterSpacing: 0.3,
          marginBottom: 4,
        },
        animation: 'fade',
      }}
    >
      <Tabs.Screen
        name="habits/index"
        options={{
          title: 'Hoy',
          tabBarIcon: ({ color }) => <TabIcon emoji="✦" color={color} />,
        }}
      />
      <Tabs.Screen
        name="books/index"
        options={{
          title: 'Biblioteca',
          tabBarIcon: ({ color }) => <TabIcon emoji="◫" color={color} />,
        }}
      />
      <Tabs.Screen
        name="movies/index"
        options={{
          title: 'Cartelera',
          tabBarIcon: ({ color }) => <TabIcon emoji="◈" color={color} />,
        }}
      />
      <Tabs.Screen
        name="finance/index"
        options={{
          title: 'Finanzas',
          tabBarIcon: ({ color }) => <TabIcon emoji="⧉" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => <ProfileIcon color={color} focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="books/search"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="movies/search"
        options={{ href: null }}
      />
    </Tabs>
  );
}
