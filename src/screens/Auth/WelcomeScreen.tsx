import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, useWindowDimensions, Image 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Routes } from '@constants/routes';
import type { AuthNavigationProp } from '@t/navigation';

interface LogoProps {
  size: number;
}

const LogoGraphic = ({ size }: LogoProps) => {
  // Make the logo significantly larger than the old medal graphic
  const logoSize = size * 2.2; 
  return (
    <View style={[styles.medalWrapper, { marginBottom: 24 }]}>
      <Image 
        source={require('../../assets/images/logo.png')}
        style={{ 
          width: logoSize, 
          height: logoSize, 
          borderRadius: 24,
          resizeMode: 'contain'
        }}
      />
    </View>
  );
};

const FEATURES = [
  {
    icon: '🤖',
    text: 'Adaptive plans that learn from every session',
  },
  {
    icon: '🏆',
    text: 'Compete fairly across all sports with RP',
  },
  {
    icon: '🥊',
    text: 'Train with your squad, not in isolation',
  },
];

const WelcomeScreen = (): React.JSX.Element => {
  const navigation = useNavigation<AuthNavigationProp<'Welcome'>>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmallScreen = height < 700;
  const isTablet = width >= 768;
  const medalSize = isSmallScreen ? 62 : isTablet ? 76 : 70;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F17" translucent={false} />
      
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingBottom: Math.max(insets.bottom, 16),
            paddingTop: isSmallScreen ? 8 : 16,
          }
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Responsive Content Container for tablets & phones */}
        <View style={styles.responsiveContainer}>
          
          {/* 1. Header & Branding Section */}
          <View style={styles.headerSection}>
            <LogoGraphic size={medalSize} />

            <View style={styles.titleContainer}>
              <Text 
                style={[
                  styles.titleLine1, 
                  isSmallScreen && styles.titleLine1Small,
                  isTablet && styles.titleLine1Tablet
                ]}
              >
                Welcome to
              </Text>
              <Text 
                style={[
                  styles.titleLine2, 
                  isSmallScreen && styles.titleLine2Small,
                  isTablet && styles.titleLine2Tablet
                ]}
              >
                FitConnect
              </Text>
            </View>

            <Text 
              style={[
                styles.subheading, 
                isSmallScreen && styles.subheadingSmall,
                isTablet && styles.subheadingTablet
              ]}
            >
              AI-powered training built around your sport, schedule, and body — not a generic template.
            </Text>
          </View>

          {/* 2. Feature Highlights (Responsive Cards) */}
          <View style={[styles.featuresList, isSmallScreen && styles.featuresListSmall]}>
            {FEATURES.map((item, index) => (
              <View 
                key={index} 
                style={[
                  styles.featureCard, 
                  isSmallScreen && styles.featureCardSmall
                ]}
              >
                <View style={[styles.iconContainer, isSmallScreen && styles.iconContainerSmall]}>
                  <Text style={styles.featureIcon}>{item.icon}</Text>
                </View>
                <Text 
                  style={[
                    styles.featureText, 
                    isSmallScreen && styles.featureTextSmall
                  ]}
                >
                  {item.text}
                </Text>
              </View>
            ))}
          </View>

          {/* 3. Bottom Action Area (Sticky / Safe Bottom) */}
          <View style={[styles.footer, isSmallScreen && styles.footerSmall]}>
            <TouchableOpacity 
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate(Routes.Auth.BASIC_INFO)}
            >
              <Text style={styles.primaryButtonText}>Get Started →</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(Routes.Auth.LOGIN)}
            >
              <Text style={styles.secondaryButtonText}>
                Already have an account? <Text style={styles.loginLinkText}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    backgroundColor: '#0B0F17',
    paddingHorizontal: 20,
  },
  responsiveContainer: {
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },

  // 1. Header Section
  headerSection: {
    alignItems: 'center',
    width: '100%',
  },

  // Medal Graphic
  medalWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    zIndex: 1,
  },
  ribbonStripe: {
    borderRadius: 3,
    position: 'absolute',
  },
  ribbonCenter: {
    borderRadius: 2,
    zIndex: 2,
  },
  medalCircle: {
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 3,
  },
  medalInnerCircle: {
    backgroundColor: '#B45309',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalStar: {
    color: '#FEF3C7',
    fontWeight: 'bold',
    marginTop: -2,
  },

  // Title & Branding
  titleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  titleLine1: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  titleLine1Small: {
    fontSize: 27,
  },
  titleLine1Tablet: {
    fontSize: 38,
  },
  titleLine2: {
    color: '#CCFF00', // Vibrant Neon Lime
    fontSize: 38,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  titleLine2Small: {
    fontSize: 32,
  },
  titleLine2Tablet: {
    fontSize: 44,
  },

  // Subheading
  subheading: {
    color: '#94A3B8', // Slate-gray
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
    fontWeight: '400',
  },
  subheadingSmall: {
    fontSize: 13.5,
    lineHeight: 19,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  subheadingTablet: {
    fontSize: 17,
    lineHeight: 25,
    paddingHorizontal: 24,
    marginBottom: 32,
  },

  // 2. Feature Cards
  featuresList: {
    width: '100%',
    marginVertical: 4,
    gap: 12,
  },
  featuresListSmall: {
    gap: 8,
    marginVertical: 2,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B26',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  featureCardSmall: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconContainerSmall: {
    width: 34,
    height: 34,
    borderRadius: 8,
    marginRight: 12,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
    flex: 1,
  },
  featureTextSmall: {
    fontSize: 13.5,
    lineHeight: 18,
  },

  // 3. Bottom Action Area
  footer: {
    width: '100%',
    paddingTop: 16,
  },
  footerSmall: {
    paddingTop: 10,
  },
  primaryButton: {
    backgroundColor: '#CCFF00', // Vibrant Neon Lime
    height: 56,
    borderRadius: 28, // Full pill
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  loginLinkText: {
    color: '#CCFF00',
    fontWeight: '600',
  },
});

export default WelcomeScreen;
