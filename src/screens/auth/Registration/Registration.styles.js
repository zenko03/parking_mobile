import { StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../../theme';

export const registrationStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 40,
    backgroundColor: colors.background.white,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.regular,
  },
  description: {
    fontSize: typography.fontSize.lg2,
    marginTop: spacing.xs2,
  },
  inputContainer: {
    marginTop: spacing.xs2,
  },
  input: {
    height: 60,
    borderWidth: 1,
    borderColor: colors.text.black,
    borderRadius: radius.lg2,
    paddingHorizontal: spacing.sm,
    marginVertical: spacing.sm,
  },
  remember: {
    marginTop: spacing.xs2,
  },
  submit: {
    marginTop: spacing.lg3,
    height: 70,
    borderRadius: radius.xxl,
  },
  submitContent: {
    height: 70,
    justifyContent: 'center',
  },
  linkContainer: {
    marginTop: 50,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    fontFamily: 'Figtree-Regular',
    fontSize: typography.fontSize.base,
  },
  loginLink: {
    marginLeft: spacing.xs3,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'Figtree-Regular',
    fontSize: typography.fontSize.base,
  },
  register: {
    marginLeft: spacing.xs3,
    fontWeight: typography.fontWeight.bold,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    padding: spacing.xs,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '50%',
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginLeft: 'auto',
  },
  body: {
    marginTop: spacing.xl,
  },
});
