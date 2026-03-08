import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../primitives/Text';
import { Icon } from '../primitives/Icon';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const t = useTheme();
  const s = styles(t);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: Dimensions.get('window').height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={s.overlayWrapper}>
        <Animated.View style={[s.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        
        <Animated.View
          style={[
            s.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={s.handleContainer}>
            <View style={s.handle} />
          </View>
          
          {title && (
            <View style={s.header}>
              <Text variant="titleSm" style={s.title}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Icon name="close" size="md" color="secondary" />
              </Pressable>
            </View>
          )}
          
          <View style={s.content}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = (t: any) =>
  StyleSheet.create({
    overlayWrapper: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: t.colors.background.overlay,
    },
    sheet: {
      backgroundColor: t.colors.background.surface,
      borderTopLeftRadius: t.radius.xl,
      borderTopRightRadius: t.radius.xl,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
      maxHeight: '90%',
      ...t.elevation['2'].ios,
      elevation: t.elevation['2'].android.elevation,
    },
    handleContainer: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.colors.border.default,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: t.space['6'],
      paddingBottom: t.space['4'],
    },
    title: {
      fontWeight: t.typography.weight.semibold,
    },
    content: {
      paddingHorizontal: t.space['6'],
    },
  });
