import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import { Colors, getThemeColors } from '@/constants/colors';
import { useTheme } from '@/store/useTheme';
import { pl } from '@/i18n/pl';
import { Account } from '@/types';
import { ACCOUNT_ICONS, ACCOUNT_COLORS } from '@/constants/accountOptions';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, icon: string, color: string) => Promise<void>;
  editingAccount?: Account | null;
}

export const AccountForm: React.FC<Props> = ({
  visible,
  onClose,
  onSave,
  editingAccount,
}) => {
  const theme = useTheme(state => state.theme);
  const colors = getThemeColors(theme);

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('wallet');
  const [selectedColor, setSelectedColor] = useState(ACCOUNT_COLORS[0].color);
  const [isSaving, setIsSaving] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setSelectedIcon(editingAccount.icon);
      setSelectedColor(editingAccount.color);
    } else {
      resetForm();
    }
  }, [editingAccount, visible]);

  const resetForm = () => {
    setName('');
    setSelectedIcon('wallet');
    setSelectedColor(ACCOUNT_COLORS[0].color);
    setShowIconPicker(false);
    setShowColorPicker(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await onSave(name.trim(), selectedIcon, selectedColor);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to save account:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedIconData = ACCOUNT_ICONS.find(i => i.id === selectedIcon);
  const selectedColorData = ACCOUNT_COLORS.find(c => c.color === selectedColor);

  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingAccount ? 'Edytuj konto' : pl.reports.addAccount}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Preview */}
            <Animated.View
              style={styles.previewContainer}
              entering={FadeIn.duration(300)}
              layout={Layout.springify()}
            >
              <View style={[styles.previewIcon, { backgroundColor: selectedColor }]}>
                <Ionicons name={selectedIcon as any} size={32} color={colors.white} />
              </View>
              <Text style={styles.previewName}>{name || 'Nazwa konta'}</Text>
            </Animated.View>

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{pl.reports.accountName}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="np. Konto osobiste"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Icon Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ikona</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setShowIconPicker(!showIconPicker)}
              >
                <View style={styles.selectorLeft}>
                  <View style={[styles.selectorIcon, { backgroundColor: selectedColor }]}>
                    <Ionicons name={selectedIcon as any} size={20} color={colors.white} />
                  </View>
                  <Text style={styles.selectorText}>
                    {selectedIconData?.name || 'Wybierz ikone'}
                  </Text>
                </View>
                <Ionicons
                  name={showIconPicker ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {showIconPicker && (
                <Animated.View
                  style={styles.pickerContainer}
                  entering={FadeInDown.duration(200)}
                >
                  <View style={styles.iconGrid}>
                    {ACCOUNT_ICONS.map((icon, index) => (
                      <Animated.View
                        key={icon.id}
                        entering={FadeIn.delay(index * 20).duration(200)}
                      >
                        <TouchableOpacity
                          style={[
                            styles.iconOption,
                            selectedIcon === icon.id && {
                              backgroundColor: selectedColor,
                              borderColor: selectedColor,
                            },
                          ]}
                          onPress={() => {
                            setSelectedIcon(icon.id);
                            setShowIconPicker(false);
                          }}
                        >
                          <Ionicons
                            name={icon.id as any}
                            size={24}
                            color={selectedIcon === icon.id ? colors.white : colors.text}
                          />
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>
                </Animated.View>
              )}
            </View>

            {/* Color Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kolor</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setShowColorPicker(!showColorPicker)}
              >
                <View style={styles.selectorLeft}>
                  <View style={[styles.colorDot, { backgroundColor: selectedColor }]} />
                  <Text style={styles.selectorText}>
                    {selectedColorData?.name || 'Wybierz kolor'}
                  </Text>
                </View>
                <Ionicons
                  name={showColorPicker ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {showColorPicker && (
                <Animated.View
                  style={styles.pickerContainer}
                  entering={FadeInDown.duration(200)}
                >
                  <View style={styles.colorGrid}>
                    {ACCOUNT_COLORS.map((colorOption, index) => (
                      <Animated.View
                        key={colorOption.id}
                        entering={FadeIn.delay(index * 15).duration(200)}
                      >
                        <TouchableOpacity
                          style={[
                            styles.colorOption,
                            { backgroundColor: colorOption.color },
                            selectedColor === colorOption.color && styles.colorOptionSelected,
                          ]}
                          onPress={() => {
                            setSelectedColor(colorOption.color);
                            setShowColorPicker(false);
                          }}
                        >
                          {selectedColor === colorOption.color && (
                            <Ionicons name="checkmark" size={18} color={colors.white} />
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>
                </Animated.View>
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: selectedColor },
                (isSaving || !name.trim()) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={isSaving || !name.trim()}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? pl.common.saving : pl.common.save}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ReturnType<typeof getThemeColors>) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
  },
  previewIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectorIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  selectorText: {
    fontSize: 16,
    color: colors.text,
  },
  pickerContainer: {
    marginTop: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: colors.white,
    transform: [{ scale: 1.1 }],
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
