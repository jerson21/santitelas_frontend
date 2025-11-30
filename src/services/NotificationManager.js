// /src/services/NotificationManager.js
class NotificationManager {
  constructor() {
    this.audioContext = null;
    this.audioBuffers = {};
    this.isInitialized = false;
    this.soundEnabled = true;
    this.vibrationEnabled = true;
    
    // Inicializar automáticamente con el primer clic del usuario
    this.initOnUserInteraction();
  }

  // Inicializar con interacción del usuario (requerido por navegadores)
  initOnUserInteraction() {
    const initHandler = () => {
      this.initialize();
      // Remover listeners después de inicializar
      document.removeEventListener('click', initHandler);
      document.removeEventListener('touchstart', initHandler);
    };
    
    document.addEventListener('click', initHandler);
    document.addEventListener('touchstart', initHandler);
  }

  // Inicializar Audio Context y pre-cargar sonidos
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Crear Audio Context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Pre-generar sonidos comunes
      this.preGenerateSounds();
      
      // Solicitar permisos de notificación
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      
      this.isInitialized = true;
      console.log('✅ NotificationManager inicializado');
    } catch (error) {
      console.error('Error al inicializar NotificationManager:', error);
    }
  }

  // Pre-generar sonidos para uso instantáneo
  preGenerateSounds() {
    // Sonido tipo WhatsApp (dos tonos ascendentes)
    this.createToneSequence('whatsapp', [
      { frequency: 800, duration: 100 },
      { frequency: 1000, duration: 100 }
    ]);
    
    // Sonido tipo Telegram (tono único más largo)
    this.createToneSequence('telegram', [
      { frequency: 600, duration: 150 }
    ]);
    
    // Sonido tipo iOS (campana suave)
    this.createBellSound('ios');
    
    // Sonido de éxito
    this.createToneSequence('success', [
      { frequency: 523, duration: 100 }, // Do
      { frequency: 659, duration: 100 }, // Mi
      { frequency: 784, duration: 150 }  // Sol
    ]);
    
    // Sonido de error
    this.createToneSequence('error', [
      { frequency: 400, duration: 200 },
      { frequency: 300, duration: 200 }
    ]);
  }

  // Crear secuencia de tonos
  createToneSequence(name, tones) {
    const sampleRate = this.audioContext.sampleRate;
    let totalDuration = tones.reduce((acc, tone) => acc + tone.duration, 0) / 1000;
    totalDuration += 0.1; // Añadir pequeño silencio al final
    
    const frameCount = sampleRate * totalDuration;
    const audioBuffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    let currentFrame = 0;
    
    tones.forEach((tone, index) => {
      const toneDuration = tone.duration / 1000;
      const toneFrames = sampleRate * toneDuration;
      
      for (let i = 0; i < toneFrames; i++) {
        const t = i / sampleRate;
        // Aplicar envelope ADSR para sonido más suave
        const envelope = this.getEnvelope(t, toneDuration);
        channelData[currentFrame + i] = Math.sin(2 * Math.PI * tone.frequency * t) * envelope * 0.3;
      }
      
      currentFrame += toneFrames;
      
      // Añadir pequeño silencio entre tonos
      if (index < tones.length - 1) {
        currentFrame += sampleRate * 0.05;
      }
    });
    
    this.audioBuffers[name] = audioBuffer;
  }

  // Crear sonido de campana
  createBellSound(name) {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5;
    const frameCount = sampleRate * duration;
    const audioBuffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    // Frecuencias armónicas de una campana
    const harmonics = [
      { freq: 500, amp: 1.0 },
      { freq: 1000, amp: 0.5 },
      { freq: 1500, amp: 0.3 },
      { freq: 2000, amp: 0.2 },
      { freq: 3000, amp: 0.1 }
    ];
    
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      let sample = 0;
      
      harmonics.forEach(h => {
        sample += Math.sin(2 * Math.PI * h.freq * t) * h.amp;
      });
      
      // Aplicar decay exponencial
      const envelope = Math.exp(-3 * t);
      channelData[i] = sample * envelope * 0.1;
    }
    
    this.audioBuffers[name] = audioBuffer;
  }

  // Obtener envelope ADSR
  getEnvelope(t, duration) {
    const attack = 0.01;
    const decay = 0.02;
    const sustain = 0.7;
    const release = 0.05;
    
    if (t < attack) {
      return t / attack;
    } else if (t < attack + decay) {
      return 1 - (1 - sustain) * ((t - attack) / decay);
    } else if (t < duration - release) {
      return sustain;
    } else {
      return sustain * ((duration - t) / release);
    }
  }

  // Reproducir sonido pre-generado
  playSound(soundName = 'whatsapp') {
    if (!this.soundEnabled || !this.isInitialized) return;
    
    const buffer = this.audioBuffers[soundName] || this.audioBuffers['whatsapp'];
    if (!buffer) return;
    
    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Volumen
      gainNode.gain.value = 0.5;
      
      source.start(0);
    } catch (error) {
      console.error('Error al reproducir sonido:', error);
    }
  }

  // Vibrar dispositivo
  vibrate(pattern = [200]) {
    if (!this.vibrationEnabled) return;
    
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  // Mostrar notificación del navegador
  async showBrowserNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          icon: '/logo192.png', // Asegúrate de tener este archivo
          badge: '/logo192.png',
          vibrate: [200, 100, 200],
          tag: 'transfer-validation', // Evita notificaciones duplicadas
          renotify: true, // Permite re-notificar con el mismo tag
          ...options
        });
        
        // Auto-cerrar después de 5 segundos
        setTimeout(() => notification.close(), 5000);
        
        return notification;
      } catch (error) {
        console.error('Error al mostrar notificación:', error);
      }
    }
  }

  // Notificación completa (sonido + vibración + notificación del navegador)
  async notify(type = 'whatsapp', title, body) {
    // Reproducir sonido
    this.playSound(type);
    
    // Vibrar
    this.vibrate([200, 100, 200]);
    
    // Mostrar notificación del navegador
    if (title) {
      await this.showBrowserNotification(title, { body });
    }
  }

  // Configuración
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
  }

  setVibrationEnabled(enabled) {
    this.vibrationEnabled = enabled;
  }
}

// Singleton
const notificationManager = new NotificationManager();

// Exportación ES6
export default notificationManager;