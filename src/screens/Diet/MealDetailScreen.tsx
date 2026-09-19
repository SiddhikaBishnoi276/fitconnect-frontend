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
  meal_type?: string;
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
        <StatusBar barStyle="light-content" backgroundColor="#0F141E" translucent={false} />
        <ActivityIndicator size="large" color="#CCFF00" />
      </SafeAreaView>
    );
  }

  const getSimplicityBadge = (level?: string) => {
    switch(level) {
      case 'easy': 
        return { text: 'EASY', bg: 'rgba(204, 255, 0, 0.05)', color: '#CCFF00', border: 'rgba(204, 255, 0, 0.2)' };
      case 'medium': 
        return { text: 'MEDIUM', bg: 'rgba(245, 158, 11, 0.05)', color: '#F59E0B', border: 'rgba(245, 158, 11, 0.2)' };
      case 'hard': 
        return { text: 'COMPLEX', bg: 'rgba(239, 68, 68, 0.05)', color: '#EF4444', border: 'rgba(239, 68, 68, 0.2)' };
      default: 
        return { text: 'EASY', bg: 'rgba(204, 255, 0, 0.05)', color: '#CCFF00', border: 'rgba(204, 255, 0, 0.2)' };
    }
  };

  const simplicity = getSimplicityBadge(meal.prep_simplicity || 'easy');

  const isPre = meal.meal_type === 'PRE_WORKOUT';
  const isPost = meal.meal_type === 'POST_WORKOUT';
  const badgeText = isPre ? 'PRE-WORKOUT' : isPost ? 'POST-WORKOUT' : null;
  const badgeColor = isPre ? 'rgba(204, 255, 0, 0.05)' : 'rgba(245, 158, 11, 0.05)';
  const badgeTextColor = isPre ? '#CCFF00' : '#F59E0B';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0F141E" translucent={false} />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.mealName}>{meal.name}</Text>
          <View style={styles.headerTags}>
            {meal.cuisine && (
              <Text style={styles.cuisineText}>🍛 {meal.cuisine}</Text>
            )}
            {badgeText && (
              <View style={[styles.typeBadge, { backgroundColor: badgeColor, borderColor: badgeTextColor }]}>
                <Text style={[styles.typeBadgeText, { color: badgeTextColor }]}>{badgeText}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 24 }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Macros Breakdown */}
        <View style={styles.card}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Protein</Text>
            <Text style={[styles.statValue, { color: '#CCFF00' }]}>{meal.protein_g}g</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Carbohydrates</Text>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{meal.carbs_g}g</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Fat</Text>
            <Text style={[styles.statValue, { color: '#818CF8' }]}>{meal.fat_g}g</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Calories</Text>
            <Text style={styles.totalValue}>{meal.calories} kcal</Text>
          </View>
        </View>

        {/* Prep Simplicity */}
        <View style={styles.prepRow}>
          <Text style={styles.sectionTitle}>PREP SIMPLICITY</Text>
          <View style={[styles.simplicityBadge, { backgroundColor: simplicity.bg, borderColor: simplicity.border }]}>
            <Text style={[styles.simplicityBadgeText, { color: simplicity.color }]}>
              {simplicity.text}
            </Text>
          </View>
        </View>

        {/* Ingredients */}
        <Text style={styles.sectionTitle}>INGREDIENTS</Text>
        <View style={styles.card}>
          {meal.ingredients && meal.ingredients.length > 0 ? (
            meal.ingredients.map((ing, idx) => (
              <View key={idx}>
                <View style={styles.ingredientRow}>
                  <View style={styles.ingredientDot} />
                  <Text style={styles.ingredientText}>
                    {ing.name}{ing.amount ? ` ${ing.amount}` : ''}
                  </Text>
                </View>
                {idx < meal.ingredients!.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No ingredients listed.</Text>
          )}
        </View>

        {/* Instructions (if any) */}
        {meal.instructions && meal.instructions.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionTitle}>INSTRUCTIONS</Text>
            <View style={styles.card}>
              {meal.instructions.map((step, idx) => (
                <View key={idx}>
                  <View style={styles.instructionRow}>
                    <Text style={styles.instructionNum}>{idx + 1}.</Text>
                    <Text style={styles.instructionText}>{step}</Text>
                  </View>
                  {idx < meal.instructions!.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F141E',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    backgroundColor: '#161B26',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  backIcon: {
    color: '#94A3B8',
    fontSize: 28,
    lineHeight: 32,
    marginLeft: -2,
  },
  headerInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cuisineText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  content: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#161B26',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  totalLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  prepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginRight: 12,
    marginBottom: 0,
  },
  simplicityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  simplicityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  ingredientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CCFF00',
    marginRight: 12,
  },
  ingredientText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  instructionRow: {
    flexDirection: 'row',
    paddingVertical: 16,
  },
  instructionNum: {
    fontSize: 14,
    color: '#CCFF00',
    fontWeight: '800',
    marginRight: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 22,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    paddingVertical: 16,
    fontStyle: 'italic',
  }
});

export default MealDetailScreen;
