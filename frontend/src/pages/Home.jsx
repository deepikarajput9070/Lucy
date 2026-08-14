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

import { userDataContext } from "../context/UserContext.jsx";

function Home() {
  const {
    serverUrl,
    userData,
    setUserData,
  } = useContext(userDataContext);

  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [images, setImages] = useState([]);
  const [showImages, setShowImages] = useState(false);

  const [listItems, setListItems] = useState([]);
  const [listTitle, setListTitle] = useState("");
  const [showList, setShowList] = useState(false);

  const [youtubeVideo, setYoutubeVideo] = useState(null);
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const [youtubePlaying, setYoutubePlaying] = useState(false);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const youtubeIframeRef = useRef(null);
  const speechVoicesRef = useRef([]);
  const pendingExternalWindowRef = useRef(null);

  const shouldListenRef = useRef(true);
  const recognitionRunningRef = useRef(false);
  const restartingRecognitionRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isLoadingRef = useRef(false);
  const manualMicChangeRef = useRef(false);
  const isLoggingOutRef = useRef(false);

  const lastTranscriptRef = useRef("");
  const lastTranscriptTimeRef = useRef(0);

  const assistantName =
    userData?.assistantName?.trim() || "Assistant";

  const assistantImage =
    userData?.assistantImage || "";

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

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
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const getBestVoice = useCallback(() => {
    if (
      typeof window === "undefined" ||
      !window.speechSynthesis
    ) {
      return null;
    }

    const voices =
      window.speechSynthesis.getVoices();

    if (!voices.length) {
      return null;
    }

    const hindiVoices = voices.filter((voice) => {
      const lang = voice.lang?.toLowerCase() || "";

      return (
        lang === "hi-in" ||
        lang.startsWith("hi")
      );
    });

    const femaleKeywords = [
      "female",
      "woman",
      "zira",
      "heera",
      "swara",
      "aditi",
      "neerja",
      "google hindi",
      "google हिन्दी",
    ];

    const femaleHindiVoice =
      hindiVoices.find((voice) => {
        const name =
          voice.name?.toLowerCase() || "";

        return femaleKeywords.some((keyword) =>
          name.includes(keyword)
        );
      });

    if (femaleHindiVoice) {
      return femaleHindiVoice;
    }

    if (hindiVoices.length > 0) {
      return hindiVoices[0];
    }

    const indianEnglishVoice = voices.find(
      (voice) =>
        voice.lang?.toLowerCase() === "en-in"
    );

    if (indianEnglishVoice) {
      return indianEnglishVoice;
    }

    const englishFemaleVoice = voices.find(
      (voice) => {
        const name =
          voice.name?.toLowerCase() || "";

        const lang =
          voice.lang?.toLowerCase() || "";

        return (
          lang.startsWith("en") &&
          femaleKeywords.some((keyword) =>
            name.includes(keyword)
          )
        );
      }
    );

    if (englishFemaleVoice) {
      return englishFemaleVoice;
    }

    return voices[0];
  }, []);

  const isExternalCommand = useCallback(
    (command) => {
      if (
        !command ||
        typeof command !== "string"
      ) {
        return false;
      }

      return /\b(open|search|google|instagram|facebook|youtube|calculator)\b/i.test(
        command
      );
    },
    []
  );

  const createPendingExternalWindow =
    useCallback(
      (command) => {
        if (
          typeof window === "undefined" ||
          !isExternalCommand(command)
        ) {
          return;
        }

        try {
          pendingExternalWindowRef.current =
            window.open("about:blank", "_blank");
        } catch {
          pendingExternalWindowRef.current = null;
        }
      },
      [isExternalCommand]
    );

  const closePendingExternalWindow =
    useCallback(() => {
      const win =
        pendingExternalWindowRef.current;

      if (win && !win.closed) {
        try {
          win.close();
        } catch {}
      }

      pendingExternalWindowRef.current = null;
    }, []);

  const openPendingExternalWindow =
    useCallback(
      (url) => {
        if (!url) {
          closePendingExternalWindow();
          return;
        }

        if (pendingExternalWindowRef.current) {
          try {
            pendingExternalWindowRef.current.location.href =
              url;
          } catch {
            closePendingExternalWindow();

            window.open(
              url,
              "_blank",
              "noopener,noreferrer"
            );
          }

          pendingExternalWindowRef.current = null;
          return;
        }

        window.open(
          url,
          "_blank",
          "noopener,noreferrer"
        );
      },
      [closePendingExternalWindow]
    );

  const stopRecognition = useCallback(() => {
    const recognition =
      recognitionRef.current;

    if (!recognition) {
      return;
    }

    recognitionRunningRef.current = false;

    try {
      recognition.abort();
    } catch {}

    setIsListening(false);
  }, []);

  const startRecognition = useCallback(() => {
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

    restartingRecognitionRef.current = true;

    try {
      recognition.start();
      recognitionRunningRef.current = true;
    } catch {}

    setTimeout(() => {
      restartingRecognitionRef.current = false;
    }, 300);
  }, []);

  const speak = useCallback(
    (text) => {
      if (
        isMuted ||
        !text ||
        typeof window === "undefined" ||
        !window.speechSynthesis
      ) {
        return;
      }

      const cleanText = String(text)
        .replace(/[\*\_\#\`]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (!cleanText) {
        return;
      }

      window.speechSynthesis.cancel();

      isSpeakingRef.current = true;

      stopRecognition();

      const utterance =
        new SpeechSynthesisUtterance(
          cleanText
        );

      const voice = getBestVoice();

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }

      utterance.rate = 1.02;
      utterance.pitch = 1.12;
      utterance.volume = 1;

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);

        if (
          shouldListenRef.current &&
          !isMuted &&
          !isLoggingOutRef.current
        ) {
          setTimeout(() => {
            startRecognition();
          }, 300);
        }
      };

      utterance.onerror = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);

        if (
          shouldListenRef.current &&
          !isMuted &&
          !isLoggingOutRef.current
        ) {
          setTimeout(() => {
            startRecognition();
          }, 300);
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

  const stopSpeaking = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      window.speechSynthesis
    ) {
      window.speechSynthesis.cancel();
    }

    isSpeakingRef.current = false;
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
  }, [isMuted, startRecognition]);

  const sendYouTubeCommand = useCallback(
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

  const pauseYouTube = useCallback(() => {
    if (!youtubeVideo) {
      return false;
    }

    sendYouTubeCommand("pauseVideo");
    setYoutubePlaying(false);

    return true;
  }, [sendYouTubeCommand, youtubeVideo]);

  const resumeYouTube = useCallback(() => {
    if (!youtubeVideo) {
      return false;
    }

    sendYouTubeCommand("playVideo");
    setYoutubePlaying(true);

    return true;
  }, [sendYouTubeCommand, youtubeVideo]);

  const closeYouTube = useCallback(() => {
    if (!youtubeVideo) {
      return false;
    }

    sendYouTubeCommand("stopVideo");

    setYoutubeVideo(null);
    setYoutubeTitle("");
    setYoutubePlaying(false);

    return true;
  }, [sendYouTubeCommand, youtubeVideo]);

  const openYouTube = useCallback(
    (data) => {
      if (!data?.videoId) {
        return;
      }

      setYoutubeVideo(data.videoId);
      setYoutubeTitle(
        data.title || "YouTube Video"
      );
      setYoutubePlaying(true);
    },
    []
  );

  const handleLocalYouTubeCommand =
    useCallback(
      (command) => {
        const text = String(command)
          .toLowerCase()
          .replace(/[.,!?]/g, "")
          .trim();

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
            response: "Closing YouTube.",
          };
        }

        const pauseCommand =
          /\b(pause|hold)\b/.test(text) &&
          (/\b(youtube|video|music|song)\b/.test(
            text
          ) || text === "pause");

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

        const resumeCommand =
          /\b(resume|continue|unpause|play)\b/.test(
            text
          ) &&
          (/\b(youtube|video|music|song)\b/.test(
            text
          ) ||
            text === "resume" ||
            text === "play");

        if (
          resumeCommand &&
          youtubeVideo
        ) {
          resumeYouTube();

          return {
            handled: true,
            response: "Resuming.",
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

  const processAssistantResponse =
    useCallback(
      (data) => {
        if (!data) {
          return;
        }

        const response =
          data.response ||
          "I'm here. How can I help?";

        if (data.type === "image_search") {
          setImages(
            Array.isArray(data.images)
              ? data.images
              : []
          );

          setShowImages(true);
          setShowList(false);
        }

        if (data.type === "close_images") {
          setShowImages(false);
          setImages([]);
        }

        if (data.type === "list_results") {
          setListItems(
            Array.isArray(data.items)
              ? data.items
              : []
          );

          setListTitle(
            data.title || "Results"
          );

          setShowList(true);
          setShowImages(false);
        }

        if (data.type === "close_list") {
          setShowList(false);
          setListItems([]);
          setListTitle("");
        }

        if (data.type === "youtube_play") {
          openYouTube(data);
          setShowImages(false);
          setShowList(false);
        }

        if (data.type === "youtube_pause") {
          pauseYouTube();
        }

        if (data.type === "youtube_resume") {
          resumeYouTube();
        }

        if (data.type === "youtube_close") {
          closeYouTube();
        }

        if (
          data.type === "youtube_search" ||
          data.type === "google_search" ||
          data.type === "weather_show" ||
          data.type === "calculator_open" ||
          data.type === "instagram_open" ||
          data.type === "facebook_open"
        ) {
          openPendingExternalWindow(
            data.url
          );
        }

        if (
          pendingExternalWindowRef.current &&
          ![
            "youtube_search",
            "google_search",
            "weather_show",
            "calculator_open",
            "instagram_open",
            "facebook_open",
          ].includes(data.type)
        ) {
          closePendingExternalWindow();
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: response,
          },
        ]);

        speak(response);
      },
      [
        closePendingExternalWindow,
        closeYouTube,
        openPendingExternalWindow,
        openYouTube,
        pauseYouTube,
        resumeYouTube,
        speak,
      ]
    );

  const sendCommand = useCallback(
    async (commandText) => {
      const command = String(
        commandText || ""
      ).trim();

      if (
        !command ||
        isLoggingOutRef.current
      ) {
        return;
      }

      if (isLoadingRef.current) {
        return;
      }

      const localResult =
        handleLocalYouTubeCommand(
          command
        );

      if (localResult.handled) {
        setMessages((prev) => [
          ...prev,
          {
            role: "user",
            text: command,
          },
          {
            role: "assistant",
            text: localResult.response,
          },
        ]);

        setInput("");

        speak(localResult.response);

        return;
      }

      stopSpeaking();

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          text: command,
        },
      ]);

      setInput("");
      setIsLoading(true);
      isLoadingRef.current = true;

      try {
        const response = await axios.post(
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

        speak(errorMessage);
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
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

  const handleSend = () => {
    createPendingExternalWindow(input);
    sendCommand(input);
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
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

    recognition.onstart = () => {
      if (isLoggingOutRef.current) {
        return;
      }

      recognitionRunningRef.current = true;
      setIsListening(true);
    };

    recognition.onresult = (event) => {
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
        lastResult[0]?.transcript?.trim();

      if (!transcript) {
        return;
      }

      const now = Date.now();

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

      sendCommand(transcript);
    };

    recognition.onerror = (event) => {
      recognitionRunningRef.current = false;
      setIsListening(false);

      if (
        event.error === "not-allowed" ||
        event.error ===
          "service-not-allowed"
      ) {
        shouldListenRef.current = false;
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

    recognition.onend = () => {
      recognitionRunningRef.current = false;
      setIsListening(false);

      if (
        !shouldListenRef.current ||
        isSpeakingRef.current ||
        isLoggingOutRef.current
      ) {
        return;
      }

      if (manualMicChangeRef.current) {
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

    shouldListenRef.current = true;

    setTimeout(() => {
      if (!isLoggingOutRef.current) {
        startRecognition();
      }
    }, 600);

    return () => {
      shouldListenRef.current = false;
      recognitionRunningRef.current = false;

      try {
        recognition.abort();
      } catch {}

      recognitionRef.current = null;
    };
  }, [sendCommand, startRecognition]);

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

      if (shouldListenRef.current) {
        manualMicChangeRef.current =
          true;

        shouldListenRef.current = false;
        recognitionRunningRef.current =
          false;

        try {
          recognition.abort();
        } catch {}

        setIsListening(false);

        return;
      }

      manualMicChangeRef.current = false;
      shouldListenRef.current = true;

      startRecognition();
    }, [startRecognition]);

  const handleLogout = useCallback(
    async () => {
      if (isLoggingOutRef.current) {
        return;
      }

      isLoggingOutRef.current = true;
      setIsLoggingOut(true);

      shouldListenRef.current = false;
      recognitionRunningRef.current = false;
      restartingRecognitionRef.current =
        false;

      manualMicChangeRef.current = true;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      setIsListening(false);

      if (
        typeof window !== "undefined" &&
        window.speechSynthesis
      ) {
        window.speechSynthesis.cancel();
      }

      isSpeakingRef.current = false;
      setIsSpeaking(false);

      if (youtubeIframeRef.current) {
        try {
          youtubeIframeRef.current.contentWindow?.postMessage(
            JSON.stringify({
              event: "command",
              func: "stopVideo",
              args: [],
            }),
            "*"
          );
        } catch {}
      }

      setUserData(null);

      try {
        // IMPORTANT:
        // Backend route is POST /api/user/logout
        await axios.post(
          `${serverUrl}/api/user/logout`,
          {},
          {
            withCredentials: true,
            timeout: 5000,
          }
        );
      } catch (error) {
        console.warn(
          "Backend logout request failed:",
          error
        );
      } finally {
        setUserData(null);

        navigate("/signin", {
          replace: true,
        });
      }
    },
    [navigate, serverUrl, setUserData]
  );

  const openImage = (image) => {
    if (image?.contextLink) {
      window.open(
        image.contextLink,
        "_blank",
        "noopener,noreferrer"
      );
    } else if (image?.link) {
      window.open(
        image.link,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      isLoggingOutRef.current = true;

      if (
        typeof window !== "undefined" &&
        window.speechSynthesis
      ) {
        window.speechSynthesis.cancel();
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const currentStatus = isLoggingOut
    ? "Logging out..."
    : isListening
    ? "Listening..."
    : isLoading
    ? "Thinking..."
    : isSpeaking
    ? "Speaking..."
    : "Ready";

  const statusColor = isListening
    ? "blue"
    : isLoading
    ? "purple"
    : isSpeaking
    ? "orange"
    : "green";

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-black via-[#030712] to-[#020617] text-white flex flex-col">
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
              {assistantName
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="text-xl font-semibold">
              {assistantName}
            </h1>

            <p className="text-xs text-gray-400">
              {currentStatus}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (isSpeaking) {
                stopSpeaking();
              }

              setIsMuted((prev) => !prev);
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
              <IoVolumeMute size={21} />
            ) : (
              <IoVolumeHigh size={21} />
            )}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="p-3 rounded-full bg-red-500/20 hover:bg-red-500/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Logout"
          >
            <IoLogOutOutline size={22} />
          </button>
        </div>
      </header>

      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
          <div className="flex flex-col items-center justify-start pt-4">
            <div className="relative flex items-center justify-center w-64 h-64">
              <div
                className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${
                  isListening
                    ? "border-blue-400/80 scale-110 animate-pulse"
                    : isLoading
                    ? "border-purple-400/80 scale-105 animate-pulse"
                    : isSpeaking
                    ? "border-orange-400/90 scale-[1.15] animate-pulse"
                    : "border-green-400/50 scale-100"
                }`}
              />

              <div
                className={`absolute inset-3 rounded-full transition-all duration-500 ${
                  isListening
                    ? "bg-blue-500/10 shadow-[0_0_45px_rgba(59,130,246,0.55)]"
                    : isLoading
                    ? "bg-purple-500/10 shadow-[0_0_45px_rgba(168,85,247,0.55)]"
                    : isSpeaking
                    ? "bg-orange-500/10 shadow-[0_0_55px_rgba(249,115,22,0.65)]"
                    : "bg-green-500/5 shadow-[0_0_30px_rgba(34,197,94,0.25)]"
                }`}
              />

              <div
                className={`absolute inset-7 rounded-full border transition-all duration-700 ${
                  isSpeaking
                    ? "border-orange-300/40 animate-ping"
                    : isListening
                    ? "border-blue-300/30 animate-pulse"
                    : isLoading
                    ? "border-purple-300/30 animate-pulse"
                    : "border-green-300/20"
                }`}
              />

              {assistantImage ? (
                <img
                  src={assistantImage}
                  alt={assistantName}
                  className={`relative z-10 w-44 h-44 rounded-full object-cover border-4 transition-all duration-300 ease-in-out ${
                    isSpeaking
                      ? "border-orange-300 shadow-[0_0_50px_rgba(249,115,22,0.75)] scale-105"
                      : isLoading
                      ? "border-purple-300 shadow-[0_0_45px_rgba(168,85,247,0.65)] scale-[1.02]"
                      : isListening
                      ? "border-blue-300 shadow-[0_0_45px_rgba(59,130,246,0.65)] scale-[1.03]"
                      : "border-green-400/70 shadow-[0_0_30px_rgba(34,197,94,0.3)] scale-100"
                  }`}
                />
              ) : (
                <div
                  className={`relative z-10 w-44 h-44 rounded-full bg-gradient-to-br from-cyan-400 to-blue-700 flex items-center justify-center text-6xl font-bold transition-all duration-300 ${
                    isSpeaking
                      ? "scale-105 shadow-[0_0_50px_rgba(249,115,22,0.75)]"
                      : isLoading
                      ? "scale-[1.02] shadow-[0_0_45px_rgba(168,85,247,0.65)]"
                      : isListening
                      ? "scale-[1.03] shadow-[0_0_45px_rgba(59,130,246,0.65)]"
                      : "scale-100 shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                  }`}
                >
                  {assistantName
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>

            <div
              className={`mt-5 px-4 py-1.5 rounded-full border text-sm transition-all duration-300 ${
                statusColor === "blue"
                  ? "border-blue-400/40 bg-blue-500/10 text-blue-300"
                  : statusColor === "purple"
                  ? "border-purple-400/40 bg-purple-500/10 text-purple-300"
                  : statusColor === "orange"
                  ? "border-orange-400/40 bg-orange-500/10 text-orange-300"
                  : "border-green-400/40 bg-green-500/10 text-green-300"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isListening
                      ? "bg-blue-400 animate-pulse"
                      : isLoading
                      ? "bg-purple-400 animate-pulse"
                      : isSpeaking
                      ? "bg-orange-400 animate-pulse"
                      : "bg-green-400"
                  }`}
                />

                {isLoggingOut
                  ? "Goodbye..."
                  : currentStatus}
              </span>
            </div>

            <h2 className="mt-3 text-2xl font-semibold">
              {assistantName}
            </h2>

            <p className="text-gray-400 text-sm mt-1 text-center">
              {isLoggingOut
                ? "Goodbye..."
                : isListening
                ? "I'm listening..."
                : isLoading
                ? `${assistantName} is thinking...`
                : isSpeaking
                ? "I'm speaking..."
                : "How can I help?"}
            </p>
          </div>

          <div className="min-w-0">
            <div className="h-[520px] lg:h-[620px] overflow-y-auto rounded-3xl bg-white/[0.03] border border-white/10 p-5 shadow-2xl">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-gray-500">
                  <div>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
                      {assistantName
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <p className="text-gray-300">
                      Say "Hey {assistantName}" and start talking.
                    </p>

                    <p className="text-xs mt-2">
                      Try: "play some music",
                      "pause YouTube", or
                      "close YouTube".
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(
                    (message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-lg ${
                            message.role === "user"
                              ? "bg-cyan-600 text-white rounded-br-md"
                              : "bg-white/10 text-gray-100 rounded-bl-md border border-white/5"
                          }`}
                        >
                          {message.text}
                        </div>
                      </div>
                    )
                  )}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="px-4 py-3 rounded-2xl bg-purple-500/10 border border-purple-400/20 text-purple-300">
                        <span className="animate-pulse">
                          {assistantName} is thinking...
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {youtubeVideo && (
        <div className="w-full max-w-5xl mx-auto px-4 mb-6">
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
                    <FaPause size={14} />
                  ) : (
                    <FaPlay size={14} />
                  )}
                </button>

                <button
                  onClick={closeYouTube}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40"
                  title="Close YouTube"
                >
                  <FaTimes size={16} />
                </button>
              </div>
            </div>

            <div className="aspect-video w-full">
              <iframe
                ref={youtubeIframeRef}
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

      {showImages && (
        <div className="w-full max-w-6xl mx-auto px-4 mb-6">
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
              {images.map((image) => (
                <button
                  key={image.id}
                  onClick={() =>
                    openImage(image)
                  }
                  className="rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-cyan-400 hover:scale-[1.02] transition"
                >
                  <img
                    src={
                      image.thumbnailLink ||
                      image.link
                    }
                    alt={
                      image.title || "Image"
                    }
                    className="w-full h-40 object-cover"
                    loading="lazy"
                  />

                  <div className="p-2 text-left">
                    <p className="text-xs text-gray-300 line-clamp-2">
                      {image.title}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-white/5 text-gray-400">
              No images found.
            </div>
          )}
        </div>
      )}

      {showList && (
        <div className="w-full max-w-3xl mx-auto px-4 mb-6">
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="font-semibold text-lg">
                {listTitle || "Results"}
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
                (item, index) => (
                  <div
                    key={
                      item.id || index
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
                          `Item ${index + 1}`}
                      </p>

                      {item.description && (
                        <p className="text-sm text-gray-400 mt-1">
                          {item.description}
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

      <div className="w-full max-w-5xl mx-auto px-4 pb-5">
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md shadow-2xl">
          <button
            type="button"
            onClick={toggleMicrophone}
            disabled={isLoggingOut}
            className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition ${
              isListening
                ? "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30"
                : "bg-white/10 hover:bg-white/20"
            } disabled:opacity-50`}
            title={
              isListening
                ? "Turn microphone off"
                : "Turn microphone on"
            }
          >
            {isListening ? (
              <IoMic size={23} />
            ) : (
              <IoMicOff size={23} />
            )}
          </button>

          <input
            type="text"
            value={input}
            disabled={isLoggingOut}
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? "Listening..."
                : `Message ${assistantName}...`
            }
            className="flex-1 min-w-0 bg-transparent outline-none px-2 text-white placeholder:text-gray-500"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={
              !input.trim() ||
              isLoading ||
              isLoggingOut
            }
            className="shrink-0 w-12 h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition shadow-lg shadow-cyan-500/20"
          >
            <IoSend size={21} />
          </button>
        </div>

        <p className="text-center text-xs text-gray-600 mt-2">
          {isLoggingOut
            ? "Logging out..."
            : isListening
            ? `${assistantName} is listening`
            : isSpeaking
            ? `${assistantName} is speaking`
            : isLoading
            ? `${assistantName} is thinking`
            : "Microphone is off"}
        </p>
      </div>
    </div>
  );
}

export default Home;
