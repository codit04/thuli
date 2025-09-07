import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';

interface HackathonInfoProps {
  onShare?: () => void;
}

const HackathonInfo: React.FC<HackathonInfoProps> = ({ onShare }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      const diff = endOfDay.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const shareProject = async () => {
    try {
      await Share.share({
        message: '🚀 Check out my AI/CV hackathon project built with React Native and Gemini AI! #Hackathon #AI #ReactNative',
        title: 'Thuli AI - Hackathon Project',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const copyTechStack = () => {
    const techStack = `🚀 Thuli AI Tech Stack:
• React Native + TypeScript
• Gemini AI Integration
• Modern UI/UX Design
• Error Boundaries
• Environment Variables
• Real-time Chat Interface

Built for AI/CV Hackathon!`;
    
    Alert.alert('Tech Stack', techStack, [
      { text: 'OK', style: 'default' }
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Hackathon Mode</Text>
      
      <View style={styles.timeCard}>
        <Text style={styles.timeLabel}>Time Remaining</Text>
        <Text style={styles.timeValue}>{timeLeft}</Text>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Project Stats</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>✅ Features Implemented:</Text>
          <Text style={styles.statValue}>AI Chat, Error Handling, Modern UI</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>🔧 Tech Stack:</Text>
          <Text style={styles.statValue}>React Native, TypeScript, Gemini AI</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>📱 Platform:</Text>
          <Text style={styles.statValue}>iOS & Android Ready</Text>
        </View>
      </View>

      <View style={styles.actionsCard}>
        <Text style={styles.actionsTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={shareProject}>
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>Share Project</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={copyTechStack}>
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionText}>View Tech Stack</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => Alert.alert('Demo Tips', '1. Start with AI chat demo\n2. Show error handling\n3. Highlight modern UI\n4. Mention rapid development')}
        >
          <Text style={styles.actionIcon}>💡</Text>
          <Text style={styles.actionText}>Demo Tips</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>🎯 Presentation Tips</Text>
        <Text style={styles.tipItem}>• Start with the problem you're solving</Text>
        <Text style={styles.tipItem}>• Demo AI chat in real-time</Text>
        <Text style={styles.tipItem}>• Show error handling robustness</Text>
        <Text style={styles.tipItem}>• Highlight rapid development capabilities</Text>
        <Text style={styles.tipItem}>• End with future possibilities</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  timeCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  timeLabel: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 8,
  },
  timeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#856404',
  },
  statsCard: {
    backgroundColor: '#d1ecf1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bee5eb',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0c5460',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  statLabel: {
    fontSize: 14,
    color: '#0c5460',
    fontWeight: '500',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    color: '#0c5460',
    flex: 2,
  },
  actionsCard: {
    backgroundColor: '#d4edda',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    color: '#155724',
    fontWeight: '500',
  },
  tipsCard: {
    backgroundColor: '#f8d7da',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#721c24',
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 14,
    color: '#721c24',
    marginBottom: 6,
    lineHeight: 20,
  },
});

export default HackathonInfo;
