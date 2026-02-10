/**
 *  ADD EDIT PARKING STYLES
 * Styles pour l'écran d'ajout/modification de parking
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography, shadows } from '../../../theme';

export const addEditParkingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.greenLight,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.greenLight,
  },

  loadingText: {
    marginTop: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.text.gray.medium,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
    backgroundColor: colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.lightGray2,
    zIndex: 100,
  },

  closeButton: {
    width: 48,
    height: 48,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },

  saveButton: {
    paddingHorizontal: spacing.base,
  },

  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.secondary.green,
  },

  content: {
    flex: 1,
  },

  pageTitle: {
    fontSize: typography.fontSize.heading.h3,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.dark,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },

  section: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },

  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.dark,
  },

  photoCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary.bright,
  },

  photoScroll: {
    marginBottom: spacing.sm,
  },

  photoContainer: {
    width: 140,
    height: 140,
    borderRadius: radius.base,
    marginRight: spacing.base,
    position: 'relative',
  },

  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: radius.base,
    backgroundColor: colors.background.lightGray2,
  },

  photoRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.background.white,
    borderRadius: radius.base,
    ...shadows.medium,
  },

  primaryBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.primary.bright,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs2,
    borderRadius: radius.xs2,
  },

  primaryBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.darkGreen,
  },

  addPhotoButton: {
    width: 140,
    height: 140,
    borderRadius: radius.base,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary.bright,
    backgroundColor: colors.primary.pale,
    justifyContent: 'center',
    alignItems: 'center',
  },

  addPhotoIcon: {
    backgroundColor: colors.primary.border,
    borderRadius: radius.xl,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },

  addPhotoText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.secondary.green,
  },

  photoHint: {
    fontSize: typography.fontSize.sm,
    color: colors.text.gray.medium,
    marginTop: spacing.sm,
  },

  inputGroup: {
    marginBottom: spacing.base,
  },

  inputLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.gray.medium,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs2,
    letterSpacing: 0.5,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: colors.border.medium,
    paddingHorizontal: spacing.base,
    ...shadows.tiny,
  },

  inputIcon: {
    marginRight: spacing.sm,
  },

  inputIconRight: {
    marginLeft: spacing.sm,
  },

  input: {
    flex: 1,
    paddingVertical: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.text.dark,
  },

  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.base,
  },

  priceInput: {
    fontSize: typography.fontSize.xl2,
    fontWeight: typography.fontWeight.bold,
  },

  mapPlaceholder: {
    height: 128,
    borderRadius: radius.base,
    backgroundColor: colors.background.lightGray2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },

  mapPlaceholderText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.text.gray.slate.medium,
  },

  vehicleList: {
    gap: spacing.base,
  },

  vehicleItem: {
    gap: spacing.sm,
  },

  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    backgroundColor: colors.background.white,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },

  vehicleChipActive: {
    backgroundColor: colors.primary.bright,
    borderColor: colors.primary.bright,
  },

  vehicleChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.gray.medium,
  },

  vehicleChipTextActive: {
    color: colors.text.darkGreen,
    fontWeight: typography.fontWeight.semibold,
  },

  vehicleCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 48,
    gap: spacing.base,
  },

  vehicleCountLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.gray.medium,
  },

  vehicleCountInput: {
    width: 80,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.white,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.medium,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.dark,
    textAlign: 'center',
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    backgroundColor: colors.background.white,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },

  chipActive: {
    backgroundColor: colors.primary.bright,
    borderColor: colors.primary.bright,
  },

  chipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.gray.medium,
  },

  chipTextActive: {
    color: colors.text.darkGreen,
    fontWeight: typography.fontWeight.semibold,
  },

  priceRow: {
    flexDirection: 'row',
    gap: spacing.base,
  },

  bottomSpacer: {
    height: 40,
  },

  // Styles pour la localisation GPS
  locationDisplay: {
    backgroundColor: colors.primary.pale,
    borderRadius: radius.base,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.primary.border,
  },

  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginBottom: spacing.base,
  },

  locationCoords: {
    flex: 1,
  },

  locationText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.darkest,
    fontWeight: typography.fontWeight.medium,
  },

  modifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.background.white,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.platform.ios,
  },

  modifyButtonText: {
    color: colors.platform.ios,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },

  locationButtons: {
    gap: spacing.base,
  },

  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.base,
  },

  gpsButton: {
    backgroundColor: colors.platform.ios,
  },

  mapButton: {
    backgroundColor: colors.background.white,
    borderWidth: 2,
    borderColor: colors.platform.ios,
  },

  locationButtonText: {
    color: colors.text.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },

  mapButtonText: {
    color: colors.platform.ios,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },

  // Styles pour la modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.white,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    backgroundColor: colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },

  modalCloseButton: {
    padding: spacing.sm,
  },

  modalTitle: {
    fontSize: typography.fontSize.xl2,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.dark,
  },

  modalConfirmButton: {
    padding: spacing.sm,
  },
});
