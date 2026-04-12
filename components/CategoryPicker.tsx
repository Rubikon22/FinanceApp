import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '@/types';
import { getThemeColors } from '@/constants/colors';
import { useTheme } from '@/store/useTheme';

interface CategoryPickerProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (category: Category) => void;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  categories,
  selectedId,
  onSelect,
}) => {
  const theme = useTheme(state => state.theme);
  const colors = getThemeColors(theme);
  const styles = createStyles(colors);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => {
        const isSelected = selectedId === category.id;
        return (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              isSelected && styles.categoryItemSelected,
              isSelected && { borderColor: category.color },
            ]}
            onPress={() => onSelect(category)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: isSelected ? category.color : colors.card },
              ]}
            >
              <Ionicons
                name={category.icon as any}
                size={24}
                color={isSelected ? colors.white : category.color}
              />
            </View>
            <Text
              style={[
                styles.categoryName,
                isSelected && { color: category.color },
              ]}
              numberOfLines={1}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

interface CategoryGridProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (category: Category) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  selectedId,
  onSelect,
}) => {
  const theme = useTheme(state => state.theme);
  const colors = getThemeColors(theme);
  const stylesGrid = createGridStyles(colors);

  return (
    <View style={stylesGrid.container}>
      {categories.map((category) => {
        const isSelected = selectedId === category.id;
        return (
          <TouchableOpacity
            key={category.id}
            style={[
              stylesGrid.categoryItem,
              isSelected && { borderColor: category.color, borderWidth: 2 },
            ]}
            onPress={() => onSelect(category)}
            activeOpacity={0.7}
          >
            <View
              style={[
                stylesGrid.iconContainer,
                { backgroundColor: category.color },
              ]}
            >
              <Ionicons
                name={category.icon as any}
                size={24}
                color={colors.white}
              />
            </View>
            <Text style={stylesGrid.categoryName} numberOfLines={1}>
              {category.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof getThemeColors>) => StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  categoryItem: {
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
  },
  categoryItemSelected: {
    backgroundColor: colors.card,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
});

const createGridStyles = (colors: ReturnType<typeof getThemeColors>) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  categoryItem: {
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    width: '23%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 11,
    color: colors.text,
    textAlign: 'center',
  },
});
