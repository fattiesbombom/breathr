import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { KawaiiColors } from '@/constants/kawaii-theme';
import { useResponsive } from '@/utils/responsive';

interface AuthScreenProps {
  onLogin: (identifier: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, username: string, age: string) => Promise<void>;
  onForgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  isLoading: boolean;
  error: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ 
  onLogin, 
  onSignup, 
  onForgotPassword, 
  isLoading, 
  error 
}) => {
  const [isSignup, setIsSignup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const responsive = useResponsive();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }
    if (isSignup) {
      if (!username.trim()) {
        return;
      }
      await onSignup(email.trim(), password, username.trim(), age.trim());
    } else {
      await onLogin(email.trim(), password);
    }
  };

  return (
    <AnimatedBackground variant="gradient">
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.authContainer, { padding: responsive.spacing }]}>
          <Text style={[styles.authTitle, { fontSize: responsive.titleSize }]}>
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={styles.authSubtitle}>
            {isSignup 
              ? 'Sign up to track your breathing'
              : 'Sign in to continue'}
          </Text>

          <View style={[styles.authCard, { maxWidth: responsive.isSmall ? 300 : 340 }]}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {isSignup && (
              <TextInput
                style={[styles.input, { fontSize: responsive.isSmall ? 16 : 18 }]}
                placeholder="Username"
                placeholderTextColor={KawaiiColors.textLight}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            )}

            <TextInput
              style={[styles.input, { fontSize: responsive.isSmall ? 16 : 18, marginTop: isSignup ? 16 : 0 }]}
              placeholder={isSignup ? 'Email' : 'Email or Username'}
              placeholderTextColor={KawaiiColors.textLight}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType={isSignup ? 'email-address' : 'default'}
              editable={!isLoading}
            />

            {isSignup && (
              <TextInput
                style={[styles.input, { fontSize: responsive.isSmall ? 16 : 18, marginTop: 16 }]}
                placeholder="Age (optional)"
                placeholderTextColor={KawaiiColors.textLight}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                editable={!isLoading}
              />
            )}

            <TextInput
              style={[styles.input, { fontSize: responsive.isSmall ? 16 : 18, marginTop: 16 }]}
              placeholder="Password"
              placeholderTextColor={KawaiiColors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            <TouchableOpacity 
              style={[styles.authSubmitButton, isLoading && styles.buttonDisabled]} 
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.authSubmitButtonText}>
                  {isSignup ? 'Sign Up' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            {!isSignup && (
              <TouchableOpacity 
                style={styles.forgotPasswordButton}
                onPress={() => setShowForgotPassword(true)}
                disabled={isLoading}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.switchAuthButton}
              onPress={() => {
                setIsSignup(!isSignup);
                setEmail('');
                setPassword('');
                setUsername('');
                setAge('');
                setShowForgotPassword(false);
                setSuccessMessage(null);
              }}
              disabled={isLoading}
            >
              <Text style={styles.switchAuthText}>
                {isSignup 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Forgot Password Modal */}
          <Modal visible={showForgotPassword} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Reset Password</Text>
                <Text style={styles.modalSubtitle}>Enter your email to receive a password reset link</Text>
                
                {successMessage && (
                  <View style={[styles.errorContainer, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
                    <Text style={[styles.errorText, { color: '#2E7D32' }]}>{successMessage}</Text>
                  </View>
                )}

                {error && !successMessage && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TextInput
                  style={styles.modalInput}
                  placeholder="Email"
                  placeholderTextColor={KawaiiColors.textLight}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!isLoading}
                />
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.modalCancelBtn} onPress={() => {
                    setShowForgotPassword(false);
                    setEmail('');
                    setSuccessMessage(null);
                  }}>
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalAddBtn} 
                    onPress={async () => {
                      if (!email.trim()) return;
                      const result = await onForgotPassword(email.trim());
                      if (result.success) {
                        setSuccessMessage(result.message);
                      }
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.modalAddText}>Send Link</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  authContainer: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
  },
  authTitle: {
    fontWeight: '700',
    color: KawaiiColors.hotPink,
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 16,
    color: KawaiiColors.text,
    opacity: 0.8,
    marginBottom: 40,
    textAlign: 'center',
  },
  authCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 32,
    padding: 24,
    borderWidth: 4,
    borderColor: KawaiiColors.softPink,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    backgroundColor: KawaiiColors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: KawaiiColors.kawaiiPink,
    padding: 16,
    color: KawaiiColors.text,
    marginBottom: 20,
  },
  authSubmitButton: {
    backgroundColor: KawaiiColors.hotPink,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  authSubmitButtonText: {
    color: KawaiiColors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  switchAuthButton: {
    marginTop: 20,
    padding: 12,
  },
  switchAuthText: {
    fontSize: 14,
    color: KawaiiColors.hotPink,
    fontWeight: '600',
    textAlign: 'center',
  },
  forgotPasswordButton: {
    marginTop: 12,
    padding: 8,
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: KawaiiColors.hotPink,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: KawaiiColors.white,
    borderRadius: 32,
    padding: 24,
    borderWidth: 4,
    borderColor: KawaiiColors.kawaiiPink,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: KawaiiColors.hotPink,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: KawaiiColors.text,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  modalInput: {
    backgroundColor: '#FFF5F8',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: KawaiiColors.kawaiiPink,
    padding: 16,
    fontSize: 18,
    color: KawaiiColors.text,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: KawaiiColors.kawaiiPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B446D',
  },
  modalAddBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: KawaiiColors.hotPink,
    alignItems: 'center',
  },
  modalAddText: {
    fontSize: 16,
    fontWeight: '700',
    color: KawaiiColors.white,
  },
});
