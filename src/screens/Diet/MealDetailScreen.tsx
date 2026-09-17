import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator 
} from 'react-native';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';

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
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </SafeAreaView>
    );
  }

  const getSimplicityColor = (level?: string) => {
    switch(level) {
      case 'easy': return Colors.status.success;
      case 'medium': return '#F59E0B'; // amber
      case 'hard': return Colors.status.error;
      default: return Colors.text.tertiary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meal Detail</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Title & Tags */}
        <View style={styles.titleSection}>
          <Text style={styles.mealName}>{meal.name}</Text>
          <View style={styles.tagsRow}>
            {meal.cuisine && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{meal.cuisine}</Text>
              </View>
            )}
            {meal.prep_simplicity && (
              <View style={[styles.tag, { borderColor: getSimplicityColor(meal.prep_simplicity) }]}>
                <Text style={[styles.tagText, { color: getSimplicityColor(meal.prep_simplicity) }]}>
                  {meal.prep_simplicity.toUpperCase()} PREP
                </Text>
              </View>
            )}
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
              <Text style={styles.statValue}>{meal.protein_g} g</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Carbohydrates</Text>
              <Text style={styles.statValue}>{meal.carbs_g} g</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Fats</Text>
              <Text style={styles.statValue}>{meal.fat_g} g</Text>
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
                  <Text style={styles.emptyText}>No ingredients listed.</Text>
                )}
                
                {meal.instructions && meal.instructions.length > 0 && (
                  <>
                    <Text style={[styles.subHeading, { marginTop: Spacing[6] }]}>Instructions:</Text>
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
    backgroundColor: Colors.background.primary,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  backText: {
    ...TextPresets.body,
    color: Colors.brand.primary,
  },
  headerTitle: {
    ...TextPresets.h4,
    color: Colors.text.primary,
  },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
  },
  titleSection: {
    marginBottom: Spacing[8],
  },
  mealName: {
    ...TextPresets.h2,
    color: Colors.text.primary,
    marginBottom: Spacing[3],
  },
  tagsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    backgroundColor: Colors.background.secondary,
  },
  tagText: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing[6],
  },
  sectionTitle: {
    ...TextPresets.h4,
    color: Colors.text.primary,
    marginBottom: Spacing[4],
  },
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing[5],
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[3],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border.primary,
  },
  statLabel: {
    ...TextPresets.body,
    color: Colors.text.secondary,
  },
  statValueMain: {
    ...TextPresets.h3,
    color: Colors.brand.primary,
  },
  statValue: {
    ...TextPresets.h4,
    color: Colors.text.primary,
  },
  subHeading: {
    ...TextPresets.body,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: Spacing[4],
  },
  ingredientRow: {
    flexDirection: 'row',
    marginBottom: Spacing[3],
    alignItems: 'flex-start',
  },
  ingredientDot: {
    ...TextPresets.body,
    color: Colors.brand.primary,
    marginRight: Spacing[2],
    width: 10,
  },
  ingredientName: {
    ...TextPresets.body,
    color: Colors.text.primary,
    flex: 1,
  },
  ingredientAmount: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    fontWeight: '600',
    marginLeft: Spacing[3],
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: Spacing[4],
  },
  instructionNum: {
    ...TextPresets.body,
    color: Colors.brand.primary,
    fontWeight: 'bold',
    marginRight: Spacing[3],
    width: 20,
  },
  instructionText: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    flex: 1,
    lineHeight: 22,
  },
  emptyText: {
    ...TextPresets.body,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  fallbackContainer: {
    alignItems: 'center',
    paddingVertical: Spacing[6],
  },
  fallbackEmoji: {
    fontSize: 40,
    marginBottom: Spacing[4],
  },
  fallbackText: {
    ...TextPresets.h4,
    color: Colors.text.primary,
    marginBottom: Spacing[2],
  },
  fallbackSubtext: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing[4],
  }
});

export default MealDetailScreen;
