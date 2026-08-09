import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  IoMic,
  IoMicOff,
  IoSend,
  IoLogOutOutline,
  IoVolumeHigh,
  IoVolumeMute,
} from "react-icons/io5";

import {
  FaPause,
  FaPlay,
  FaTimes,
} from "react-icons/fa";

import {
  userDataContext,
} from "../context/UserContext.jsx";

// ============================================================
// HOME
// ============================================================

function Home() {
  const {
    serverUrl,
    userData,
    setUserData,
  } = useContext(userDataContext);

  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const [isListening, setIsListening] =
    useState(false);

  const [isSpeaking, setIsSpeaking] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [isMuted, setIsMuted] =
    useState(false);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const [images, setImages] =
    useState([]);

  const [showImages, setShowImages] =
    useState(false);

  const [listItems, setListItems] =
    useState([]);

  const [listTitle, setListTitle] =
    useState("");

  const [showList, setShowList] =
    useState(false);

  const [youtubeVideo, setYoutubeVideo] =
    useState(null);

  const [youtubeTitle, setYoutubeTitle] =
    useState("");

  const [youtubePlaying, setYoutubePlaying] =
    useState(false);

  // ==========================================================
  // REFS
  // ==========================================================

  const recognitionRef =
    useRef(null);

  const messagesEndRef =
    useRef(null);

  const youtubeIframeRef =
    useRef(null);

  const speechVoicesRef =
    useRef([]);

  // ==========================================================
  // MIC CONTROL REFS
  // ==========================================================

  const shouldListenRef =
    useRef(true);

  const recognitionRunningRef =
    useRef(false);

  const restartingRecognitionRef =
    useRef(false);

  const isSpeakingRef =
    useRef(false);

  const isLoadingRef =
    useRef(false);

  const manualMicChangeRef =
    useRef(false);

  const isLoggingOutRef =
    useRef(false);

  // Prevent duplicate voice commands.
  const lastTranscriptRef =
    useRef("");

  const lastTranscriptTimeRef =
    useRef(0);

  // ==========================================================
  // ASSISTANT DATA
  // ==========================================================

  const assistantName =
    userData?.assistantName ||
    "Lucy";

  const assistantImage =
    userData?.assistantImage ||
    "";

  // ==========================================================
  // KEEP LOADING REF IN SYNC
  // ==========================================================

  useEffect(() => {
    isLoadingRef.current =
      isLoading;
  }, [isLoading]);

  // ==========================================================
  // SCROLL CHAT
  // ==========================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ==========================================================
  // LOAD BROWSER VOICES
  // ==========================================================

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.speechSynthesis
    ) {
      return;
    }

    const loadVoices = () => {
      speechVoicesRef.current =
        window.speechSynthesis.getVoices();
    };

    loadVoices();

    window.speechSynthesis.onvoiceschanged =
      loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged =
        null;
    };
  }, []);

  // ==========================================================
  // FIND BEST FEMALE VOICE
  // ==========================================================

  const getBestVoice =
    useCallback(() => {
      if (
        typeof window === "undefined" ||
        !window.speechSynthesis
      ) {
        return null;
      }

      const voices =
        speechVoicesRef.current.length
          ? speechVoicesRef.current
          : window.speechSynthesis.getVoices();

      if (!voices.length) {
        return null;
      }

      const preferredNames = [
        "Microsoft Jenny",
        "Microsoft Aria",
        "Microsoft Zira",
        "Google UK English Female",
        "Google US English Female",
        "Samantha",
        "Karen",
        "Moira",
        "Tessa",
        "Victoria",
        "Veena",
        "Aditi",
      ];

      for (
        const preferredName of preferredNames
      ) {
        const found =
          voices.find((voice) =>
            voice.name
              .toLowerCase()
              .includes(
                preferredName.toLowerCase()
              )
          );

        if (found) {
          return found;
        }
      }

      const femaleVoice =
        voices.find((voice) =>
          /female|jenny|aria|zira|samantha|karen|moira|tessa|victoria|veena|aditi/i.test(
            voice.name
          )
        );

      if (femaleVoice) {
        return femaleVoice;
      }

      const indianEnglishVoice =
        voices.find(
          (voice) =>
            /en-IN/i.test(
              voice.lang
            )
        );

      if (indianEnglishVoice) {
        return indianEnglishVoice;
      }

      const englishVoice =
        voices.find(
          (voice) =>
            /^en(-|_)/i.test(
              voice.lang
            )
        );

      return (
        englishVoice ||
        voices[0]
      );
    }, []);

  // ==========================================================
  // STOP RECOGNITION
  // ==========================================================

  const stopRecognition =
    useCallback(() => {
      const recognition =
        recognitionRef.current;

      if (!recognition) {
        return;
      }

      recognitionRunningRef.current =
        false;

      try {
        recognition.abort();
      } catch {
        // Ignore.
      }

      setIsListening(false);
    }, []);

  // ==========================================================
  // START RECOGNITION
  // ==========================================================

  const startRecognition =
    useCallback(() => {
      const recognition =
        recognitionRef.current;

      if (!recognition) {
        return;
      }

      if (
        !shouldListenRef.current ||
        isSpeakingRef.current ||
        isLoggingOutRef.current
      ) {
        return;
      }

      if (
        recognitionRunningRef.current ||
        restartingRecognitionRef.current
      ) {
        return;
      }

      restartingRecognitionRef.current =
        true;

      try {
        recognition.start();

        recognitionRunningRef.current =
          true;
      } catch {
        // Already running.
      }

      setTimeout(() => {
        restartingRecognitionRef.current =
          false;
      }, 300);
    }, []);

  // ==========================================================
  // SPEAK
  // ==========================================================

  const speak =
    useCallback(
      (text) => {
        if (
          isMuted ||
          !text ||
          typeof window === "undefined" ||
          !window.speechSynthesis
        ) {
          return;
        }

        const cleanText =
          String(text)
            .replace(
              /[*_#`]/g,
              ""
            )
            .replace(
              /\s+/g,
              " "
            )
            .trim();

        if (!cleanText) {
          return;
        }

        window.speechSynthesis.cancel();

        isSpeakingRef.current =
          true;

        stopRecognition();

        const utterance =
          new SpeechSynthesisUtterance(
            cleanText
          );

        const voice =
          getBestVoice();

        if (voice) {
          utterance.voice =
            voice;
        }

        // ====================================================
        // LUCY VOICE SETTINGS
        // ====================================================

        utterance.rate = 0.88;
        utterance.pitch = 1.20;
        utterance.volume = 0.95;

        utterance.onstart = () => {
          isSpeakingRef.current =
            true;

          setIsSpeaking(true);
        };

        utterance.onend = () => {
          isSpeakingRef.current =
            false;

          setIsSpeaking(false);

          if (
            shouldListenRef.current &&
            !isMuted &&
            !isLoggingOutRef.current
          ) {
            setTimeout(() => {
              startRecognition();
            }, 400);
          }
        };

        utterance.onerror = () => {
          isSpeakingRef.current =
            false;

          setIsSpeaking(false);

          if (
            shouldListenRef.current &&
            !isMuted &&
            !isLoggingOutRef.current
          ) {
            setTimeout(() => {
              startRecognition();
            }, 400);
          }
        };

        window.speechSynthesis.speak(
          utterance
        );
      },
      [
        getBestVoice,
        isMuted,
        startRecognition,
        stopRecognition,
      ]
    );

  // ==========================================================
  // STOP SPEAKING
  // ==========================================================

  const stopSpeaking =
    useCallback(() => {
      if (
        typeof window !== "undefined" &&
        window.speechSynthesis
      ) {
        window.speechSynthesis.cancel();
      }

      isSpeakingRef.current =
        false;

      setIsSpeaking(false);

      if (
        shouldListenRef.current &&
        !isMuted &&
        !isLoggingOutRef.current
      ) {
        setTimeout(() => {
          startRecognition();
        }, 250);
      }
    }, [
      isMuted,
      startRecognition,
    ]);

  // ==========================================================
  // YOUTUBE COMMAND
  // ==========================================================

  const sendYouTubeCommand =
    useCallback(
      (command) => {
        const iframe =
          youtubeIframeRef.current;

        if (!iframe) {
          return;
        }

        iframe.contentWindow?.postMessage(
          JSON.stringify({
            event: "command",
            func: command,
            args: [],
          }),
          "*"
        );
      },
      []
    );

  // ==========================================================
  // PAUSE YOUTUBE
  // ==========================================================

  const pauseYouTube =
    useCallback(() => {
      if (!youtubeVideo) {
        return false;
      }

      sendYouTubeCommand(
        "pauseVideo"
      );

      setYoutubePlaying(false);

      return true;
    }, [
      sendYouTubeCommand,
      youtubeVideo,
    ]);

  // ==========================================================
  // RESUME YOUTUBE
  // ==========================================================

  const resumeYouTube =
    useCallback(() => {
      if (!youtubeVideo) {
        return false;
      }

      sendYouTubeCommand(
        "playVideo"
      );

      setYoutubePlaying(true);

      return true;
    }, [
      sendYouTubeCommand,
      youtubeVideo,
    ]);

  // ==========================================================
  // CLOSE YOUTUBE
  // ==========================================================

  const closeYouTube =
    useCallback(() => {
      if (!youtubeVideo) {
        return false;
      }

      sendYouTubeCommand(
        "stopVideo"
      );

      setYoutubeVideo(null);
      setYoutubeTitle("");
      setYoutubePlaying(false);

      return true;
    }, [
      sendYouTubeCommand,
      youtubeVideo,
    ]);

  // ==========================================================
  // OPEN YOUTUBE
  // ==========================================================

  const openYouTube =
    useCallback((data) => {
      if (!data?.videoId) {
        return;
      }

      setYoutubeVideo(
        data.videoId
      );

      setYoutubeTitle(
        data.title ||
          "YouTube Video"
      );

      setYoutubePlaying(true);
    }, []);

  // ==========================================================
  // LOCAL YOUTUBE COMMAND DETECTION
  // ==========================================================

  const handleLocalYouTubeCommand =
    useCallback(
      (command) => {
        const text =
          String(command)
            .toLowerCase()
            .replace(
              /[.,!?]/g,
              ""
            )
            .trim();

        // ----------------------------------------------------
        // CLOSE YOUTUBE
        // ----------------------------------------------------

        const closeCommand =
          /\b(close|hide|remove|dismiss|exit|stop)\b/.test(
            text
          ) &&
          /\b(youtube|video|player)\b/.test(
            text
          );

        if (
          closeCommand &&
          youtubeVideo
        ) {
          closeYouTube();

          return {
            handled: true,
            response:
              "Closing YouTube.",
          };
        }

        // ----------------------------------------------------
        // PAUSE
        // ----------------------------------------------------

        const pauseCommand =
          /\b(pause|hold)\b/.test(
            text
          ) &&
          (
            /\b(youtube|video|music|song)\b/.test(
              text
            ) ||
            text === "pause"
          );

        if (
          pauseCommand &&
          youtubeVideo
        ) {
          pauseYouTube();

          return {
            handled: true,
            response: "Paused.",
          };
        }

        // ----------------------------------------------------
        // RESUME
        // ----------------------------------------------------

        const resumeCommand =
          /\b(resume|continue|unpause|play)\b/.test(
            text
          ) &&
          (
            /\b(youtube|video|music|song)\b/.test(
              text
            ) ||
            text === "resume" ||
            text === "play"
          );

        if (
          resumeCommand &&
          youtubeVideo
        ) {
          resumeYouTube();

          return {
            handled: true,
            response:
              "Resuming.",
          };
        }

        return {
          handled: false,
        };
      },
      [
        closeYouTube,
        pauseYouTube,
        resumeYouTube,
        youtubeVideo,
      ]
    );

  // ==========================================================
  // PROCESS ASSISTANT RESPONSE
  // ==========================================================

  const processAssistantResponse =
    useCallback(
      (data) => {
        if (!data) {
          return;
        }

        const response =
          data.response ||
          "I'm here. How can I help?";

        // ----------------------------------------------------
        // IMAGE SEARCH
        // ----------------------------------------------------

        if (
          data.type ===
          "image_search"
        ) {
          setImages(
            Array.isArray(
              data.images
            )
              ? data.images
              : []
          );

          setShowImages(true);
          setShowList(false);
        }

        // ----------------------------------------------------
        // CLOSE IMAGES
        // ----------------------------------------------------

        if (
          data.type ===
          "close_images"
        ) {
          setShowImages(false);
          setImages([]);
        }

        // ----------------------------------------------------
        // LIST
        // ----------------------------------------------------

        if (
          data.type ===
          "list_results"
        ) {
          setListItems(
            Array.isArray(
              data.items
            )
              ? data.items
              : []
          );

          setListTitle(
            data.title ||
              "Results"
          );

          setShowList(true);
          setShowImages(false);
        }

        // ----------------------------------------------------
        // CLOSE LIST
        // ----------------------------------------------------

        if (
          data.type ===
          "close_list"
        ) {
          setShowList(false);
          setListItems([]);
          setListTitle("");
        }

        // ----------------------------------------------------
        // YOUTUBE PLAY
        // ----------------------------------------------------

        if (
          data.type ===
          "youtube_play"
        ) {
          openYouTube(data);

          setShowImages(false);
          setShowList(false);
        }

        // ----------------------------------------------------
        // YOUTUBE PAUSE
        // ----------------------------------------------------

        if (
          data.type ===
          "youtube_pause"
        ) {
          pauseYouTube();
        }

        // ----------------------------------------------------
        // YOUTUBE RESUME
        // ----------------------------------------------------

        if (
          data.type ===
          "youtube_resume"
        ) {
          resumeYouTube();
        }

        // ----------------------------------------------------
        // YOUTUBE CLOSE
        // ----------------------------------------------------

        if (
          data.type ===
          "youtube_close"
        ) {
          closeYouTube();
        }

        // ----------------------------------------------------
        // YOUTUBE SEARCH
        // ----------------------------------------------------

        if (
          data.type ===
          "youtube_search"
        ) {
          if (data.url) {
            window.open(
              data.url,
              "_blank",
              "noopener,noreferrer"
            );
          }
        }

        // ----------------------------------------------------
        // GOOGLE SEARCH
        // ----------------------------------------------------

        if (
          data.type ===
          "google_search"
        ) {
          if (data.url) {
            window.open(
              data.url,
              "_blank",
              "noopener,noreferrer"
            );
          }
        }

        // ----------------------------------------------------
        // OTHER URL FEATURES
        // ----------------------------------------------------

        if (
          data.type ===
            "weather_show" ||
          data.type ===
            "calculator_open" ||
          data.type ===
            "instagram_open" ||
          data.type ===
            "facebook_open"
        ) {
          if (data.url) {
            window.open(
              data.url,
              "_blank",
              "noopener,noreferrer"
            );
          }
        }

        // ----------------------------------------------------
        // ADD ASSISTANT MESSAGE
        // ----------------------------------------------------

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: response,
          },
        ]);

        // ----------------------------------------------------
        // SPEAK
        // ----------------------------------------------------

        speak(response);
      },
      [
        closeYouTube,
        openYouTube,
        pauseYouTube,
        resumeYouTube,
        speak,
      ]
    );

  // ==========================================================
  // SEND COMMAND
  // ==========================================================

  const sendCommand =
    useCallback(
      async (commandText) => {
        const command =
          String(
            commandText || ""
          ).trim();

        if (
          !command ||
          isLoggingOutRef.current
        ) {
          return;
        }

        if (
          isLoadingRef.current
        ) {
          return;
        }

        // ----------------------------------------------------
        // LOCAL YOUTUBE CONTROLS
        // ----------------------------------------------------

        const localResult =
          handleLocalYouTubeCommand(
            command
          );

        if (
          localResult.handled
        ) {
          setMessages((prev) => [
            ...prev,
            {
              role: "user",
              text: command,
            },
            {
              role: "assistant",
              text:
                localResult.response,
            },
          ]);

          setInput("");

          speak(
            localResult.response
          );

          return;
        }

        // ----------------------------------------------------
        // STOP CURRENT SPEECH
        // ----------------------------------------------------

        stopSpeaking();

        // ----------------------------------------------------
        // ADD USER MESSAGE
        // ----------------------------------------------------

        setMessages((prev) => [
          ...prev,
          {
            role: "user",
            text: command,
          },
        ]);

        setInput("");

        setIsLoading(true);

        isLoadingRef.current =
          true;

        try {
          const response =
            await axios.post(
              `${serverUrl}/api/user/asktoassistant`,
              {
                command,
              },
              {
                withCredentials: true,
              }
            );

          processAssistantResponse(
            response.data
          );
        } catch (error) {
          console.error(
            "Assistant request error:",
            error
          );

          const errorMessage =
            "I'm having trouble connecting right now. Please try again.";

          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              text: errorMessage,
            },
          ]);

          speak(
            errorMessage
          );
        } finally {
          setIsLoading(false);

          isLoadingRef.current =
            false;
        }
      },
      [
        handleLocalYouTubeCommand,
        processAssistantResponse,
        serverUrl,
        speak,
        stopSpeaking,
      ]
    );

  // ==========================================================
  // SEND BUTTON
  // ==========================================================

  const handleSend = () => {
    sendCommand(input);
  };

  // ==========================================================
  // ENTER KEY
  // ==========================================================

  const handleKeyDown =
    (event) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        handleSend();
      }
    };

  // ==========================================================
  // SPEECH RECOGNITION
  // ==========================================================

  useEffect(() => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn(
        "Speech recognition is not supported in this browser."
      );

      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-IN";
    recognition.maxAlternatives = 1;

    // --------------------------------------------------------
    // ON START
    // --------------------------------------------------------

    recognition.onstart =
      () => {
        if (
          isLoggingOutRef.current
        ) {
          return;
        }

        recognitionRunningRef.current =
          true;

        setIsListening(true);
      };

    // --------------------------------------------------------
    // ON RESULT
    // --------------------------------------------------------

    recognition.onresult =
      (event) => {
        if (
          isLoggingOutRef.current ||
          isSpeakingRef.current
        ) {
          return;
        }

        const lastResult =
          event.results[
            event.results.length - 1
          ];

        if (!lastResult) {
          return;
        }

        const transcript =
          lastResult[0]?.transcript
            ?.trim();

        if (!transcript) {
          return;
        }

        const now =
          Date.now();

        if (
          transcript.toLowerCase() ===
            lastTranscriptRef.current.toLowerCase() &&
          now -
            lastTranscriptTimeRef.current <
            1800
        ) {
          return;
        }

        lastTranscriptRef.current =
          transcript;

        lastTranscriptTimeRef.current =
          now;

        setInput(transcript);

        if (
          isLoadingRef.current ||
          isSpeakingRef.current ||
          isLoggingOutRef.current
        ) {
          return;
        }

        sendCommand(
          transcript
        );
      };

    // --------------------------------------------------------
    // ON ERROR
    // --------------------------------------------------------

    recognition.onerror =
      (event) => {
        recognitionRunningRef.current =
          false;

        setIsListening(false);

        if (
          event.error ===
            "not-allowed" ||
          event.error ===
            "service-not-allowed"
        ) {
          shouldListenRef.current =
            false;

          return;
        }

        if (
          shouldListenRef.current &&
          !isSpeakingRef.current &&
          !isLoggingOutRef.current &&
          !manualMicChangeRef.current
        ) {
          setTimeout(() => {
            if (
              shouldListenRef.current &&
              !isSpeakingRef.current &&
              !recognitionRunningRef.current &&
              !isLoggingOutRef.current
            ) {
              startRecognition();
            }
          }, 700);
        }
      };

    // --------------------------------------------------------
    // ON END
    // --------------------------------------------------------

    recognition.onend =
      () => {
        recognitionRunningRef.current =
          false;

        setIsListening(false);

        if (
          !shouldListenRef.current ||
          isSpeakingRef.current ||
          isLoggingOutRef.current
        ) {
          return;
        }

        if (
          manualMicChangeRef.current
        ) {
          manualMicChangeRef.current =
            false;

          return;
        }

        if (
          !restartingRecognitionRef.current
        ) {
          setTimeout(() => {
            if (
              shouldListenRef.current &&
              !isSpeakingRef.current &&
              !recognitionRunningRef.current &&
              !isLoggingOutRef.current
            ) {
              startRecognition();
            }
          }, 500);
        }
      };

    recognitionRef.current =
      recognition;

    // --------------------------------------------------------
    // MIC ON BY DEFAULT
    // --------------------------------------------------------

    shouldListenRef.current =
      true;

    setTimeout(() => {
      if (
        !isLoggingOutRef.current
      ) {
        startRecognition();
      }
    }, 600);

    // --------------------------------------------------------
    // CLEANUP
    // --------------------------------------------------------

    return () => {
      shouldListenRef.current =
        false;

      recognitionRunningRef.current =
        false;

      try {
        recognition.abort();
      } catch {
        // Ignore.
      }

      recognitionRef.current =
        null;
    };
  }, [
    sendCommand,
    startRecognition,
  ]);

  // ==========================================================
  // TOGGLE MICROPHONE
  // ==========================================================

  const toggleMicrophone =
    useCallback(() => {
      const recognition =
        recognitionRef.current;

      if (
        !recognition ||
        isLoggingOutRef.current
      ) {
        return;
      }

      // ------------------------------------------------------
      // TURN MIC OFF
      // ------------------------------------------------------

      if (
        shouldListenRef.current
      ) {
        manualMicChangeRef.current =
          true;

        shouldListenRef.current =
          false;

        recognitionRunningRef.current =
          false;

        try {
          recognition.abort();
        } catch {
          // Ignore.
        }

        setIsListening(false);

        return;
      }

      // ------------------------------------------------------
      // TURN MIC ON
      // ------------------------------------------------------

      manualMicChangeRef.current =
        false;

      shouldListenRef.current =
        true;

      startRecognition();
    }, [
      startRecognition,
    ]);

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout =
    useCallback(async () => {
      // Prevent double-click logout.
      if (
        isLoggingOutRef.current
      ) {
        return;
      }

      isLoggingOutRef.current =
        true;

      setIsLoggingOut(true);

      // ------------------------------------------------------
      // STOP MICROPHONE
      // ------------------------------------------------------

      shouldListenRef.current =
        false;

      recognitionRunningRef.current =
        false;

      restartingRecognitionRef.current =
        false;

      manualMicChangeRef.current =
        true;

      if (
        recognitionRef.current
      ) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore.
        }
      }

      setIsListening(false);

      // ------------------------------------------------------
      // STOP SPEECH
      // ------------------------------------------------------

      if (
        typeof window !== "undefined" &&
        window.speechSynthesis
      ) {
        window.speechSynthesis.cancel();
      }

      isSpeakingRef.current =
        false;

      setIsSpeaking(false);

      // ------------------------------------------------------
      // STOP YOUTUBE
      // ------------------------------------------------------

      if (
        youtubeIframeRef.current
      ) {
        try {
          youtubeIframeRef.current.contentWindow?.postMessage(
            JSON.stringify({
              event: "command",
              func: "stopVideo",
              args: [],
            }),
            "*"
          );
        } catch {
          // Ignore.
        }
      }

      // ------------------------------------------------------
      // CLEAR FRONTEND SESSION IMMEDIATELY
      // ------------------------------------------------------

      setUserData(null);

      // ------------------------------------------------------
      // TRY BACKEND LOGOUT
      // ------------------------------------------------------

      try {
        await axios.get(
          `${serverUrl}/api/user/logout`,
          {
            withCredentials: true,
            timeout: 5000,
          }
        );
      } catch (error) {
        console.warn(
          "Backend logout request failed, continuing logout:",
          error
        );
      } finally {
        // ----------------------------------------------------
        // ALWAYS GO TO SIGN IN
        // ----------------------------------------------------

        setUserData(null);

        navigate(
          "/signin",
          {
            replace: true,
          }
        );
      }
    }, [
      navigate,
      serverUrl,
      setUserData,
    ]);

  // ==========================================================
  // IMAGE CLICK
  // ==========================================================

  const openImage =
    (image) => {
      if (
        image?.contextLink
      ) {
        window.open(
          image.contextLink,
          "_blank",
          "noopener,noreferrer"
        );
      } else if (
        image?.link
      ) {
        window.open(
          image.link,
          "_blank",
          "noopener,noreferrer"
        );
      }
    };

  // ==========================================================
  // CLEANUP SPEECH
  // ==========================================================

  useEffect(() => {
    return () => {
      shouldListenRef.current =
        false;

      isLoggingOutRef.current =
        true;

      if (
        typeof window !== "undefined" &&
        window.speechSynthesis
      ) {
        window.speechSynthesis.cancel();
      }

      if (
        recognitionRef.current
      ) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore.
        }
      }
    };
  }, []);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-black via-[#030712] to-[#020617] text-white flex flex-col">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="w-full px-5 py-4 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-md">

        <div className="flex items-center gap-3">

          {assistantImage ? (
            <img
              src={assistantImage}
              alt={assistantName}
              className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400 shadow-lg shadow-cyan-500/30"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-xl">
              L
            </div>
          )}

          <div>
            <h1 className="text-xl font-semibold">
              {assistantName}
            </h1>

            <p className="text-xs text-gray-400">
              {isLoggingOut
                ? "Logging out..."
                : isListening
                ? "Listening..."
                : isSpeaking
                ? "Speaking..."
                : "Ready"}
            </p>
          </div>

        </div>

        <div className="flex items-center gap-2">

          {/* SPEAKER */}

          <button
            onClick={() => {
              if (isSpeaking) {
                stopSpeaking();
              }

              setIsMuted(
                (prev) => !prev
              );
            }}
            disabled={isLoggingOut}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
            title={
              isMuted
                ? "Enable voice"
                : "Mute voice"
            }
          >
            {isMuted ? (
              <IoVolumeMute
                size={21}
              />
            ) : (
              <IoVolumeHigh
                size={21}
              />
            )}
          </button>

          {/* LOGOUT */}

          <button
            type="button"
            onClick={
              handleLogout
            }
            disabled={
              isLoggingOut
            }
            className="p-3 rounded-full bg-red-500/20 hover:bg-red-500/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Logout"
          >
            <IoLogOutOutline
              size={22}
            />
          </button>

        </div>

      </header>

      {/* ====================================================
          ASSISTANT AREA
      ==================================================== */}

      <div className="flex flex-col items-center pt-6 px-4">

        {assistantImage ? (
          <img
            src={assistantImage}
            alt={assistantName}
            className={`w-36 h-36 md:w-44 md:h-44 rounded-full object-cover border-4 transition-all duration-500 ${
              isSpeaking
                ? "border-cyan-300 shadow-[0_0_50px_rgba(34,211,238,0.7)] scale-105"
                : isListening
                ? "border-green-400 shadow-[0_0_40px_rgba(34,197,94,0.5)]"
                : "border-cyan-500/50"
            }`}
          />
        ) : (
          <div
            className={`w-36 h-36 md:w-44 md:h-44 rounded-full bg-gradient-to-br from-cyan-400 to-blue-700 flex items-center justify-center text-6xl font-bold transition-all ${
              isSpeaking
                ? "scale-105 shadow-[0_0_50px_rgba(34,211,238,0.7)]"
                : ""
            }`}
          >
            L
          </div>
        )}

        <h2 className="mt-4 text-2xl font-semibold">
          {assistantName}
        </h2>

        <p className="text-gray-400 text-sm mt-1">
          {isLoggingOut
            ? "Goodbye..."
            : isListening
            ? "I'm listening..."
            : isSpeaking
            ? "I'm speaking..."
            : "How can I help?"}
        </p>

      </div>

      {/* ====================================================
          YOUTUBE PLAYER
      ==================================================== */}

      {youtubeVideo && (
        <div className="w-full max-w-4xl mx-auto px-4 mt-6">

          <div className="bg-black/50 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">

              <div className="flex items-center gap-2 min-w-0">

                <span className="text-red-400">
                  YouTube
                </span>

                <span className="text-sm text-gray-300 truncate">
                  {youtubeTitle}
                </span>

              </div>

              <div className="flex items-center gap-2">

                <button
                  onClick={
                    youtubePlaying
                      ? pauseYouTube
                      : resumeYouTube
                  }
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
                  title={
                    youtubePlaying
                      ? "Pause"
                      : "Resume"
                  }
                >
                  {youtubePlaying ? (
                    <FaPause
                      size={14}
                    />
                  ) : (
                    <FaPlay
                      size={14}
                    />
                  )}
                </button>

                <button
                  onClick={
                    closeYouTube
                  }
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40"
                  title="Close YouTube"
                >
                  <FaTimes
                    size={16}
                  />
                </button>

              </div>

            </div>

            <div className="aspect-video w-full">

              <iframe
                ref={
                  youtubeIframeRef
                }
                key={youtubeVideo}
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeVideo}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(
                  window.location.origin
                )}`}
                title={youtubeTitle}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />

            </div>

          </div>

        </div>
      )}

      {/* ====================================================
          IMAGE RESULTS
      ==================================================== */}

      {showImages && (
        <div className="w-full max-w-6xl mx-auto px-4 mt-6">

          <div className="flex items-center justify-between mb-3">

            <h3 className="text-lg font-semibold">
              Image Results
            </h3>

            <button
              onClick={() => {
                setShowImages(false);
                setImages([]);
              }}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
            >
              Close
            </button>

          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

              {images.map(
                (image) => (
                  <button
                    key={
                      image.id
                    }
                    onClick={() =>
                      openImage(
                        image
                      )
                    }
                    className="rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-cyan-400 hover:scale-[1.02] transition"
                  >
                    <img
                      src={
                        image.thumbnailLink ||
                        image.link
                      }
                      alt={
                        image.title ||
                        "Image"
                      }
                      className="w-full h-40 object-cover"
                      loading="lazy"
                    />

                    <div className="p-2 text-left">
                      <p className="text-xs text-gray-300 line-clamp-2">
                        {
                          image.title
                        }
                      </p>
                    </div>

                  </button>
                )
              )}

            </div>
          ) : (
            <div className="p-5 rounded-xl bg-white/5 text-gray-400">
              No images found.
            </div>
          )}

        </div>
      )}

      {/* ====================================================
          LIST RESULTS
      ==================================================== */}

      {showList && (
        <div className="w-full max-w-3xl mx-auto px-4 mt-6">

          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">

            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">

              <h3 className="font-semibold text-lg">
                {listTitle ||
                  "Results"}
              </h3>

              <button
                onClick={() => {
                  setShowList(false);
                  setListItems([]);
                  setListTitle("");
                }}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
              >
                Close
              </button>

            </div>

            <div className="p-4 space-y-2">

              {listItems.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={
                      item.id ||
                      index
                    }
                    className="flex items-center gap-3 p-3 rounded-xl bg-black/20 hover:bg-white/10 transition"
                  >

                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-sm">
                      {index + 1}
                    </div>

                    <div className="flex-1">

                      <p className="font-medium">
                        {item.title ||
                          item.name ||
                          `Item ${
                            index + 1
                          }`}
                      </p>

                      {item.description && (
                        <p className="text-sm text-gray-400 mt-1">
                          {
                            item.description
                          }
                        </p>
                      )}

                    </div>

                  </div>
                )
              )}

            </div>

          </div>

        </div>
      )}

      {/* ====================================================
          CHAT
      ==================================================== */}

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-6">

        <div className="space-y-4">

          {messages.length ===
            0 && (
            <div className="text-center text-gray-500 py-10">

              <p>
                Say "Hey{" "}
                {assistantName}"
                and start talking.
              </p>

              <p className="text-xs mt-2">
                Try: "play some music",
                "pause YouTube", or
                "close YouTube".
              </p>

            </div>
          )}

          {messages.map(
            (
              message,
              index
            ) => (
              <div
                key={index}
                className={`flex ${
                  message.role ===
                  "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >

                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.role ===
                    "user"
                      ? "bg-cyan-600 text-white rounded-br-md"
                      : "bg-white/10 text-gray-100 rounded-bl-md"
                  }`}
                >
                  {message.text}
                </div>

              </div>
            )
          )}

          {isLoading && (
            <div className="flex justify-start">

              <div className="px-4 py-3 rounded-2xl bg-white/10 text-gray-400">
                <span className="animate-pulse">
                  {assistantName} is
                  thinking...
                </span>
              </div>

            </div>
          )}

          <div
            ref={
              messagesEndRef
            }
          />

        </div>

      </div>

      {/* ====================================================
          INPUT
      ==================================================== */}

      <div className="w-full max-w-4xl mx-auto px-4 pb-5">

        <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md">

          {/* MIC */}

          <button
            type="button"
            onClick={
              toggleMicrophone
            }
            disabled={
              isLoggingOut
            }
            className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition ${
              isListening
                ? "bg-green-500 hover:bg-green-600"
                : "bg-white/10 hover:bg-white/20"
            } disabled:opacity-50`}
            title={
              isListening
                ? "Turn microphone off"
                : "Turn microphone on"
            }
          >
            {isListening ? (
              <IoMic
                size={23}
              />
            ) : (
              <IoMicOff
                size={23}
              />
            )}
          </button>

          {/* INPUT */}

          <input
            type="text"
            value={input}
            disabled={
              isLoggingOut
            }
            onChange={(e) =>
              setInput(
                e.target.value
              )
            }
            onKeyDown={
              handleKeyDown
            }
            placeholder={
              isListening
                ? "Listening..."
                : "Type a message..."
            }
            className="flex-1 min-w-0 bg-transparent outline-none px-2 text-white placeholder:text-gray-500"
          />

          {/* SEND */}

          <button
            type="button"
            onClick={
              handleSend
            }
            disabled={
              !input.trim() ||
              isLoading ||
              isLoggingOut
            }
            className="shrink-0 w-12 h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition"
          >
            <IoSend
              size={21}
            />
          </button>

        </div>

        <p className="text-center text-xs text-gray-600 mt-2">
          {isLoggingOut
            ? "Logging out..."
            : isListening
            ? "Microphone is on"
            : "Microphone is off"}
        </p>

      </div>

    </div>
  );
}

export default Home;