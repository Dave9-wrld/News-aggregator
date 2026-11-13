"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AudioContext = createContext({
  speakingId: null,
  isPlaying: false,
  playNarration: () => {},
  stopNarration: () => {},
  toggleNarration: () => {},
});

let currentActiveUtterance = null;

export function AudioProvider({ children }) {
  const [speakingId, setSpeakingId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const stopNarration = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    currentActiveUtterance = null;
    setSpeakingId(null);
    setIsPlaying(false);
  }, []);

  const playNarration = useCallback((id, textToSpeak) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !textToSpeak) {
      return;
    }

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();

    const cleanText = textToSpeak.replace(/https?:\/\/[^\s]+/g, "").trim().slice(0, 1500);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.98;
    utterance.pitch = 1.0;

    // Pick the most natural-sounding voice available
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const preferredVoice =
          voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Jenny") || v.name.includes("Guy") || v.name.includes("Aria"))) ||
          voices.find((v) => v.lang.startsWith("en") && !v.localService) ||
          voices.find((v) => v.lang.startsWith("en")) ||
          voices[0];
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }
    } catch {
      // Fall back to default browser voice
    }

    currentActiveUtterance = utterance;

    utterance.onstart = () => {
      setSpeakingId(id);
      setIsPlaying(true);
    };

    utterance.onend = () => {
      currentActiveUtterance = null;
      setSpeakingId(null);
      setIsPlaying(false);
    };

    utterance.onerror = (e) => {
      currentActiveUtterance = null;
      if (e.error !== "canceled" && e.error !== "interrupted") {
        console.warn("TTS narration notice:", e.error);
      }
      setSpeakingId(null);
      setIsPlaying(false);
    };

    try {
      window.speechSynthesis.speak(utterance);
      setSpeakingId(id);
      setIsPlaying(true);
    } catch (err) {
      console.warn("TTS speak exception:", err);
      setSpeakingId(null);
      setIsPlaying(false);
    }
  }, []);

  const toggleNarration = useCallback(
    (id, textToSpeak) => {
      if (speakingId === id && isPlaying) {
        stopNarration();
      } else {
        playNarration(id, textToSpeak);
      }
    },
    [speakingId, isPlaying, stopNarration, playNarration]
  );

  // Global cleanup when window unloads
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <AudioContext.Provider
      value={{
        speakingId,
        isPlaying,
        playNarration,
        stopNarration,
        toggleNarration,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudioPlayer() {
  return useContext(AudioContext);
}
