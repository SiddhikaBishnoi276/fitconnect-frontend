import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';

interface Ingredient {
  name: string;
  amount: string;
}

interface MealDetail {
  id: string;
  name: string;
  cuisine?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  prep_simplicity?: 'easy' | 'medium' | 'hard';
  ingredients: Ingredient[] | null;
  instructions?: string[];
}

const MealDetailScreen = (): React.JSX.Element => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const { mealId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [meal, setMeal] = useState<MealDetail | null>(null);

  useEffect(() => {
    const fetchMealDetail = async () => {
      try {
        const res = await apiClient.get(Endpoints.diet.meal(mealId));
        setMeal(res.data?.data);
      } catch (error) {
        console.error('Failed to fetch meal details:', error);
      } finally {
        setLoading(false);
      }
    };
    if (mealId) {
      fetchMealDetail();
    } else {
      setLoading(false);
    }
  }, [mealId]);

  if (loading || !meal) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F17" translucent={false} />
        <ActivityIndicator size="large" color="#F59E0B" />
      </SafeAreaView>
    );
  }

  const getSimplicityBadge = (level?: string) => {
    switch(level) {
      case 'easy': 
        return { text: 'EASY PREP', bg: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', border: 'rgba(34, 197, 94, 0.25)' };
      case 'medium': 
        return { text: 'MEDIUM PREP', bg: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: 'rgba(245, 158, 11, 0.25)' };
      case 'hard': 
        return { text: 'COMPLEX PREP', bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'rgba(239, 68, 68, 0.25)' };
      default: 
        return { text: 'NUTRITIOUS', bg: 'rgba(204, 255, 0, 0.1)', color: '#CCFF00', border: 'rgba(204, 255, 0, 0.25)' };
    }
  };

  const simplicity = getSimplicityBadge(meal.prep_simplicity);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F17" translucent={false} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meal Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 24 }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Tags */}
        <View style={styles.titleSection}>
          <Text style={styles.mealName}>{meal.name}</Text>
          <View style={styles.tagsRow}>
            {meal.cuisine && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{meal.cuisine}</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: simplicity.bg, borderColor: simplicity.border }]}>
              <Text style={[styles.badgeText, { color: simplicity.color }]}>
                {simplicity.text}
              </Text>
            </View>
          </View>
        </View>

        {/* Macros Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Macros & Energy</Text>
          <View style={styles.card}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Calories</Text>
              <Text style={styles.statValueMain}>{meal.calories} kcal</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Protein</Text>
              <Text style={[styles.statValue, { color: '#38BDF8' }]}>{meal.protein_g} g</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Carbohydrates</Text>
              <Text style={[styles.statValue, { color: '#FBBF24' }]}>{meal.carbs_g} g</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Fats</Text>
              <Text style={[styles.statValue, { color: '#F87171' }]}>{meal.fat_g} g</Text>
            </View>
          </View>
        </View>

        {/* Ingredients & Prep */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients & Prep</Text>
          
          <View style={styles.card}>
            {meal.ingredients === null ? (
              <View style={styles.fallbackContainer}>
                <Text style={styles.fallbackEmoji}>🕒</Text>
                <Text style={styles.fallbackText}>Details unavailable right now</Text>
                <Text style={styles.fallbackSubtext}>
                  The AI is still elaborating on this recipe or the request timed out. You can still use the macros above for tracking.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.subHeading}>What you need:</Text>
                {meal.ingredients.length > 0 ? (
                  meal.ingredients.map((ing, idx) => (
                    <View key={idx} style={styles.ingredientRow}>
                      <Text style={styles.ingredientDot}>•</Text>
                      <Text style={styles.ingredientName}>{ing.name}</Text>
                      <Text style={styles.ingredientAmount}>{ing.amount}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No specific ingredients listed.</Text>
                )}
                
                {meal.instructions && meal.instructions.length > 0 && (
                  <>
                    <Text style={[styles.subHeading, { marginTop: 20 }]}>Instructions:</Text>
                    {meal.instructions.map((step, idx) => (
                      <View key={idx} style={styles.instructionRow}>
                        <Text style={styles.instructionNum}>{idx + 1}.</Text>
                        <Text style={styles.instructionText}>{step}</Text>
                      </View>
                    ))}
                  </>
                )}
              </>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2638',
  },
  backText: {
    fontSize: 16,
    color: '#CCFF00',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  titleSection: {
    marginBottom: 20,
  },
  mealName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E2638',
    backgroundColor: '#131926',
  },
  tagText: {
    fontSize: 12,
    color: '#8E9BAE',
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#131926',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E2638',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E2638',
  },
  statLabel: {
    fontSize: 14,
    color: '#8E9BAE',
    fontWeight: '500',
  },
  statValueMain: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F59E0B',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  subHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  ingredientDot: {
    fontSize: 14,
    color: '#F59E0B',
    marginRight: 8,
    width: 10,
  },
  ingredientName: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  ingredientAmount: {
    fontSize: 14,
    color: '#8E9BAE',
    fontWeight: '600',
    marginLeft: 8,
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  instructionNum: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '700',
    marginRight: 10,
    width: 22,
  },
  instructionText: {
    fontSize: 14,
    color: '#8E9BAE',
    flex: 1,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#55657E',
    fontStyle: 'italic',
  },
  fallbackContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  fallbackEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  fallbackSubtext: {
    fontSize: 13,
    color: '#8E9BAE',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  }
});

export default MealDetailScreen;
