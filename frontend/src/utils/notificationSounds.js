// Notification sound utility using Web Audio API
class NotificationSounds {
  constructor() {
    this.audioContext = null;
    this.isEnabled = localStorage.getItem('notificationSounds') !== 'false';
    this.volume = parseFloat(localStorage.getItem('notificationVolume') || '0.3');
    
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      // Create audio context when user interacts (required by browsers)
      if (typeof window !== 'undefined' && window.AudioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
    } catch (error) {
      console.log('Audio context initialization failed:', error);
    }
  }

  play(priority = 'default') {
    if (!this.isEnabled || !this.audioContext) return;
    
    try {
      const frequency = this.getFrequency(priority);
      const duration = this.getDuration(priority);
      
      this.playTone(frequency, duration);
    } catch (error) {
      console.log('Sound play error:', error);
    }
  }

  getFrequency(priority) {
    const frequencies = {
      urgent: 800,    // Higher pitch for urgent
      high: 600,      // Medium-high for high priority
      medium: 400,    // Medium pitch for medium priority
      low: 300,       // Lower pitch for low priority
      default: 500    // Default pitch
    };
    
    return frequencies[priority] || frequencies.default;
  }

  getDuration(priority) {
    const durations = {
      urgent: 0.8,    // Longer for urgent
      high: 0.6,      // Medium-long for high
      medium: 0.4,    // Medium duration
      low: 0.3,       // Short for low
      default: 0.5    // Default duration
    };
    
    return durations[priority] || durations.default;
  }

  playTone(frequency, duration) {
    if (!this.audioContext) return;

    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine';

    // Create a nice envelope
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
    localStorage.setItem('notificationSounds', enabled.toString());
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('notificationVolume', this.volume.toString());
  }

  getPrioritySound(notificationType, priority) {
    // Map notification types to specific sounds
    const typeSounds = {
      'loan_overdue': 'urgent',
      'system_alert': 'high',
      'loan_approved': 'medium',
      'loan_rejected': 'medium',
      'customer_added': 'low',
      'loan_added': 'high'
    };

    return typeSounds[notificationType] || priority || 'default';
  }

  // Initialize audio context on user interaction
  enableAudio() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// Create a singleton instance
const notificationSounds = new NotificationSounds();

export default notificationSounds;
