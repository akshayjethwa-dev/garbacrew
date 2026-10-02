import React, { useRef, useState } from "react";
import { View, TextInput, StyleSheet, Text, TouchableOpacity } from "react-native";

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  onResend: () => void;
  resendCountdown: number;
  error?: string;
  loading?: boolean;
}

export default function OTPInput({
  length = 6,
  onComplete,
  onResend,
  resendCountdown,
  error,
  loading = false,
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, "");

    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, length - index).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, length - 1);
      inputs.current[nextIndex]?.focus();
      if (newOtp.every((d) => d !== "")) onComplete(newOtp.join(""));
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);

    if (cleaned && index < length - 1) inputs.current[index + 1]?.focus();
    if (newOtp.every((d) => d !== "")) onComplete(newOtp.join(""));
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.otpRow}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputs.current[index] = ref; }}
            style={[
              styles.otpBox,
              digit && styles.otpBoxFilled,
              error && styles.otpBoxError,
            ]}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            editable={!loading}
          />
        ))}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        onPress={onResend}
        disabled={resendCountdown > 0}
        style={styles.resendButton}
      >
        <Text
          style={[
            styles.resendText,
            resendCountdown > 0 && styles.resendDisabled,
          ]}
        >
          {resendCountdown > 0
            ? `Resend OTP in ${resendCountdown}s`
            : "Resend OTP"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", width: "100%" },
  otpRow: { flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 16 },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    backgroundColor: "#FAFAFA",
  },
  otpBoxFilled: { borderColor: "#E91E63", backgroundColor: "#FFF5F8" },
  otpBoxError: { borderColor: "#FF3B30" },
  errorText: { color: "#FF3B30", fontSize: 13, marginBottom: 8, textAlign: "center" },
  resendButton: { paddingVertical: 8 },
  resendText: { fontSize: 15, color: "#E91E63", fontWeight: "600" },
  resendDisabled: { color: "#999" },
});