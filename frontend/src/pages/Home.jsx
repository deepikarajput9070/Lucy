import React, {
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { userDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Home() {
  const navigate = useNavigate();

  const { userData, serverUrl, setUserData } =
    useContext(userDataContext);

  // =========================
  // STATE
  // =========================

  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const [youtubePlaying, setYoutubePlaying] = useState(false);

  const [imageResults, setImageResults] = useState([]);
  const [imageQuery, setImageQuery] = useState("");

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // =========================
  // REFS
  // =========================

  const playerRef = useRef(null);
  const playerContainerRef = useRef(null);

  const recognitionRef = useRef(null);

  const recognitionRunningRef = useRef(false);
  const recognitionStartingRef = useRef(false);

  const processingCommandRef = useRef(false);

  const isSpeakingRef = useRef(false);

  const mountedRef = useRef(false);

  const shouldContinueRef = useRef(true);

  const restartTimerRef = useRef(null);

  const youtubeVideoIdRef = useRef(null);

  const youtubePlayingRef = useRef(false);

  const playerReadyRef = useRef(false);

  const mediaModeRef = useRef(false);

  // =========================
  // NORMALIZE COMMAND
  // =========================

  const normalizeCommand = (text = "") => {
    return text
      .toLowerCase()
      .replace(/[.,!?]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // =========================
  // GROQ REQUEST
  // =========================

  const getGroqResponse = async (command) => {
    try {
      const result = await axios.post(
        `${serverUrl}/api/user/asktoassistant`,
        {
          command,
        },
        {
          withCredentials: true,
        }
      );

      return result.data;
    } catch {
      return null;
    }
  };

  // =========================
  // RESTART TIMER
  // =========================

  const clearRestartTimer = () => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  // =========================
  // STOP RECOGNITION
  // =========================

  const stopRecognition = () => {
    clearRestartTimer();

    recognitionStartingRef.current = false;

    const recognition = recognitionRef.current;

    if (!recognition) return;

    if (recognitionRunningRef.current) {
      try {
        recognition.stop();
      } catch {}
    }
  };

  // =========================
  // START RECOGNITION
  // =========================

  const startRecognition = () => {
    const recognition = recognitionRef.current;

    if (!recognition) return;

    if (!mountedRef.current) return;

    if (!shouldContinueRef.current) return;

    if (isSpeakingRef.current) return;

    if (processingCommandRef.current) return;

    if (mediaModeRef.current) return;

    if (recognitionRunningRef.current) return;

    if (recognitionStartingRef.current) return;

    recognitionStartingRef.current = true;

    try {
      recognition.start();
    } catch {
      recognitionStartingRef.current = false;
    }
  };

  // =========================
  // RESTART RECOGNITION
  // =========================

  const restartRecognition = (delay = 700) => {
    if (!mountedRef.current) return;

    if (!shouldContinueRef.current) return;

    if (isSpeakingRef.current) return;

    if (processingCommandRef.current) return;

    if (mediaModeRef.current) return;

    clearRestartTimer();

    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null;

      startRecognition();
    }, delay);
  };

  // =========================
  // FEMALE VOICE
  // =========================

  const getFemaleVoice = () => {
    const voices = window.speechSynthesis.getVoices();

    if (!voices.length) return null;

    const preferred = [
      "Microsoft Zira",
      "Microsoft Jenny",
      "Google US English",
      "Samantha",
      "Karen",
      "Victoria",
      "Google UK English Female",
      "Aria",
    ];

    for (const name of preferred) {
      const voice = voices.find((v) =>
        v.name.toLowerCase().includes(name.toLowerCase())
      );

      if (voice) return voice;
    }

    return (
      voices.find((v) => v.lang === "en-US") ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0]
    );
  };

  // =========================
  // SPEAK RESPONSE
  // =========================

  const speakResponse = (text) => {
    if (!text) {
      processingCommandRef.current = false;
      setIsProcessing(false);

      if (!mediaModeRef.current) {
        restartRecognition(700);
      }

      return;
    }

    isSpeakingRef.current = true;

    setIsSpeaking(true);

    stopRecognition();

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    const voice = getFemaleVoice();

    if (voice) {
      speech.voice = voice;
    }

    speech.lang = "en-US";
    speech.rate = 0.92;
    speech.pitch = 1.08;
    speech.volume = 1;

    speech.onend = () => {
      isSpeakingRef.current = false;

      setIsSpeaking(false);

      processingCommandRef.current = false;

      setIsProcessing(false);

      if (!mediaModeRef.current) {
        restartRecognition(800);
      }
    };

    speech.onerror = () => {
      isSpeakingRef.current = false;

      setIsSpeaking(false);

      processingCommandRef.current = false;

      setIsProcessing(false);

      if (!mediaModeRef.current) {
        restartRecognition(800);
      }
    };

    window.speechSynthesis.speak(speech);
  };

  // =========================
  // PLAY YOUTUBE
  // =========================

  const playVideo = () => {
    const player = playerRef.current;

    if (
      player &&
      playerReadyRef.current &&
      typeof player.playVideo === "function"
    ) {
      try {
        player.playVideo();

        youtubePlayingRef.current = true;
        setYoutubePlaying(true);

        mediaModeRef.current = true;

        stopRecognition();
      } catch {}
    }
  };

  // =========================
  // PAUSE YOUTUBE
  // =========================

  const pauseVideo = () => {
    const player = playerRef.current;

    if (
      player &&
      playerReadyRef.current &&
      typeof player.pauseVideo === "function"
    ) {
      try {
        player.pauseVideo();

        youtubePlayingRef.current = false;
        setYoutubePlaying(false);

        mediaModeRef.current = true;

        stopRecognition();
      } catch {}
    }
  };

  // =========================
  // STOP YOUTUBE
  // =========================

  const stopVideo = () => {
    const player = playerRef.current;

    if (
      player &&
      playerReadyRef.current &&
      typeof player.stopVideo === "function"
    ) {
      try {
        player.stopVideo();

        youtubePlayingRef.current = false;
        setYoutubePlaying(false);
      } catch {}
    }
  };

  // =========================
  // CLOSE YOUTUBE
  // =========================

  const closeVideo = () => {
    stopRecognition();

    mediaModeRef.current = false;

    playerReadyRef.current = false;

    youtubePlayingRef.current = false;

    setYoutubePlaying(false);

    if (playerRef.current) {
      try {
        playerRef.current.stopVideo();
      } catch {}

      try {
        playerRef.current.destroy();
      } catch {}

      playerRef.current = null;
    }

    youtubeVideoIdRef.current = null;

    setYoutubeVideoId(null);

    setYoutubeTitle("");

    processingCommandRef.current = false;

    setIsProcessing(false);

    if (!isSpeakingRef.current) {
      restartRecognition(800);
    }
  };

  // =========================
  // CLOSE IMAGES
  // =========================

  const closeImages = () => {
    setImageResults([]);

    setImageQuery("");

    processingCommandRef.current = false;

    setIsProcessing(false);

    if (!isSpeakingRef.current) {
      restartRecognition(500);
    }
  };

  // =========================
  // IMAGE COMMAND
  // =========================

  const isCloseImageCommand = (command) => {
    const c = normalizeCommand(command);

    return (
      c === "close images" ||
      c === "close image" ||
      c === "close image results" ||
      c === "close the images" ||
      c === "close the image results" ||
      c === "close pictures" ||
      c === "close photos" ||
      c === "hide images" ||
      c === "hide image results" ||
      c === "close them"
    );
  };

  // =========================
  // YOUTUBE CLOSE COMMAND
  // =========================

  const isCloseYoutubeCommand = (command) => {
    const c = normalizeCommand(command);

    return (
      c === "close youtube" ||
      c === "close the youtube" ||
      c === "exit youtube" ||
      c === "close video" ||
      c === "close music" ||
      c === "close song" ||
      c === "stop youtube" ||
      c === "close player"
    );
  };

  // =========================
  // PAUSE COMMAND
  // =========================

  const isPauseCommand = (command) => {
    const c = normalizeCommand(command);

    return [
      "pause",
      "pause music",
      "pause song",
      "pause video",
      "pause youtube",
      "pause the music",
      "pause the video",
      "pause it",
    ].includes(c);
  };

  // =========================
  // PLAY COMMAND
  // =========================

  const isPlayCommand = (command) => {
    const c = normalizeCommand(command);

    return [
      "play",
      "resume",
      "continue",
      "play music",
      "play song",
      "play video",
      "play youtube",
      "resume music",
      "resume video",
      "continue music",
      "resume it",
      "play it",
    ].includes(c);
  };

  // =========================
  // STOP COMMAND
  // =========================

  const isStopCommand = (command) => {
    const c = normalizeCommand(command);

    return [
      "stop",
      "stop music",
      "stop song",
      "stop video",
      "stop youtube",
      "stop it",
    ].includes(c);
  };

  // =========================
  // LOCAL MEDIA COMMAND
  // =========================

  const handleLocalMediaCommand = (command) => {
    if (isCloseImageCommand(command)) {
      if (imageResults.length > 0) {
        closeImages();

        speakResponse("Closing the image results.");
      } else {
        speakResponse("There are no image results open.");
      }

      return true;
    }

    if (isCloseYoutubeCommand(command)) {
      if (youtubeVideoIdRef.current) {
        closeVideo();

        speakResponse("YouTube closed.");
      } else {
        speakResponse("YouTube is not open.");
      }

      return true;
    }

    if (youtubeVideoIdRef.current) {
      if (isPauseCommand(command)) {
        pauseVideo();

        speakResponse("Paused.");

        return true;
      }

      if (isPlayCommand(command)) {
        playVideo();

        speakResponse("Playing.");

        return true;
      }

      if (isStopCommand(command)) {
        stopVideo();

        speakResponse("Stopped.");

        return true;
      }
    }

    return false;
  };

  // =========================
  // EXTRACT YOUTUBE ID
  // =========================

  const extractVideoId = (response) => {
    if (response?.videoId) {
      return response.videoId;
    }

    if (!response?.url) {
      return null;
    }

    const match = response.url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/
    );

    return match?.[1] || null;
  };

  // =========================
  // HANDLE ASSISTANT RESPONSE
  // =========================

  const handleAssistantResponse = async (response) => {
    if (!response) return;

    let textToSpeak = "";

    if (typeof response === "string") {
      textToSpeak = response;
    } else if (response.response) {
      textToSpeak = response.response;
    }

    // =========================
    // IMAGE SEARCH
    // =========================

    if (response.type === "image_search") {
      const images = Array.isArray(response.images)
        ? response.images
        : [];

      setImageResults(images);

      setImageQuery(
        response.query ||
          response.userInput ||
          ""
      );

      if (textToSpeak) {
        speakResponse(textToSpeak);
      } else {
        processingCommandRef.current = false;

        setIsProcessing(false);

        restartRecognition(700);
      }

      return;
    }

    // =========================
    // YOUTUBE
    // =========================

    if (response.type === "youtube_play") {
      const videoId = extractVideoId(response);

      if (videoId) {
        stopRecognition();

        mediaModeRef.current = true;

        playerReadyRef.current = false;

        youtubePlayingRef.current = false;

        setYoutubePlaying(false);

        setYoutubeVideoId(videoId);

        youtubeVideoIdRef.current = videoId;

        setYoutubeTitle(
          response.response ||
            response.userInput ||
            "YouTube"
        );

        setImageResults([]);

        setImageQuery("");

        if (textToSpeak) {
          speakResponse(textToSpeak);
        }

        return;
      }
    }

    // =========================
    // GOOGLE SEARCH
    // =========================

    if (
      response.type === "google_search" &&
      response.url
    ) {
      window.open(
        response.url,
        "_blank",
        "noopener,noreferrer"
      );

      speakResponse(textToSpeak || "Searching.");

      return;
    }

    // =========================
    // OTHER LINKS
    // =========================

    if (
      response.url &&
      [
        "weather_show",
        "calculator_open",
        "instagram_open",
        "facebook_open",
      ].includes(response.type)
    ) {
      window.open(
        response.url,
        "_blank",
        "noopener,noreferrer"
      );

      speakResponse(textToSpeak || "Done.");

      return;
    }

    // =========================
    // NORMAL RESPONSE
    // =========================

    if (textToSpeak) {
      speakResponse(textToSpeak);
    } else {
      processingCommandRef.current = false;

      setIsProcessing(false);

      restartRecognition(700);
    }
  };

  // =========================
  // HANDLE COMMAND
  // =========================

  const handleCommand = async (transcript) => {
    if (!transcript) return;

    const normalized = normalizeCommand(transcript);

    const assistantName = (
      userData?.assistantName || "Lucy"
    ).toLowerCase();

    let command = normalized;

    // User only says Lucy
    if (command === assistantName) {
      speakResponse(
        "Yes? What would you like me to do?"
      );

      return;
    }

    // Lucy + command
    if (
      command.startsWith(
        assistantName + " "
      )
    ) {
      command = command
        .substring(assistantName.length)
        .trim();
    } else if (
      command.startsWith("lucy ")
    ) {
      command = command
        .substring(5)
        .trim();
    }

    // =========================
    // LOCAL COMMANDS
    // =========================

    const localHandled =
      handleLocalMediaCommand(command);

    if (localHandled) {
      processingCommandRef.current = false;

      setIsProcessing(false);

      return;
    }

    // =========================
    // GROQ
    // =========================

    const response =
      await getGroqResponse(command);

    if (!response) {
      processingCommandRef.current = false;

      setIsProcessing(false);

      speakResponse(
        "I'm having trouble connecting right now."
      );

      return;
    }

    await handleAssistantResponse(response);
  };

  // =====================================================
  // YOUTUBE IFRAME API
  // =====================================================

  useEffect(() => {
    if (!youtubeVideoId) {
      return;
    }

    let cancelled = false;

    const createPlayer = () => {
      if (cancelled) return;

      if (!window.YT || !window.YT.Player) {
        return;
      }

      if (!playerContainerRef.current) {
        return;
      }

      // Destroy previous player
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}

        playerRef.current = null;
      }

      playerReadyRef.current = false;

      // IMPORTANT:
      // Explicitly tell YouTube that our parent origin
      // is localhost:5173.
      const origin = window.location.origin;

      playerRef.current =
        new window.YT.Player(
          playerContainerRef.current,
          {
            videoId: youtubeVideoId,

            host: "https://www.youtube.com",

            playerVars: {
              autoplay: 1,
              controls: 1,
              rel: 0,
              modestbranding: 1,
              playsinline: 1,
              fs: 1,

              // IMPORTANT FIX
              enablejsapi: 1,
              origin: origin,
            },

            events: {
              onReady: (event) => {
                if (cancelled) return;

                playerReadyRef.current = true;

                mediaModeRef.current = true;

                stopRecognition();

                try {
                  event.target.setVolume(100);

                  event.target.playVideo();

                  youtubePlayingRef.current = true;

                  setYoutubePlaying(true);
                } catch {}
              },

              onStateChange: (event) => {
                if (cancelled) return;

                if (!window.YT?.PlayerState) {
                  return;
                }

                const states =
                  window.YT.PlayerState;

                // PLAYING
                if (
                  event.data ===
                  states.PLAYING
                ) {
                  youtubePlayingRef.current = true;

                  setYoutubePlaying(true);

                  mediaModeRef.current = true;

                  stopRecognition();
                }

                // PAUSED
                if (
                  event.data ===
                  states.PAUSED
                ) {
                  youtubePlayingRef.current = false;

                  setYoutubePlaying(false);

                  // Keep media mode active.
                  // User can press Activate Lucy.
                  mediaModeRef.current = true;

                  stopRecognition();
                }

                // ENDED
                if (
                  event.data ===
                  states.ENDED
                ) {
                  youtubePlayingRef.current = false;

                  setYoutubePlaying(false);

                  mediaModeRef.current = false;

                  restartRecognition(800);
                }
              },

              onError: () => {
                playerReadyRef.current = false;

                youtubePlayingRef.current = false;

                setYoutubePlaying(false);

                mediaModeRef.current = false;

                restartRecognition(800);
              },
            },
          }
        );
    };

    // If API is already loaded
    if (
      window.YT &&
      window.YT.Player
    ) {
      const timer = setTimeout(() => {
        createPlayer();
      }, 100);

      return () => {
        cancelled = true;

        clearTimeout(timer);
      };
    }

    // Check whether script already exists
    const existingScript =
      document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );

    // Save previous callback
    const previousCallback =
      window.onYouTubeIframeAPIReady;

    // Create our callback
    window.onYouTubeIframeAPIReady = () => {
      if (
        typeof previousCallback ===
        "function"
      ) {
        try {
          previousCallback();
        } catch {}
      }

      createPlayer();
    };

    // Load API only once
    if (!existingScript) {
      const script =
        document.createElement("script");

      script.src =
        "https://www.youtube.com/iframe_api";

      script.async = true;

      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;

      // Restore previous callback
      window.onYouTubeIframeAPIReady =
        previousCallback;

      playerReadyRef.current = false;

      if (playerRef.current) {
        try {
          playerRef.current.stopVideo();
        } catch {}

        try {
          playerRef.current.destroy();
        } catch {}

        playerRef.current = null;
      }
    };
  }, [youtubeVideoId]);

  // =====================================================
  // SPEECH RECOGNITION
  // =====================================================

  useEffect(() => {
    mountedRef.current = true;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous = true;

    recognition.interimResults = false;

    recognition.lang = "en-US";

    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;

    // =========================
    // ON START
    // =========================

    recognition.onstart = () => {
      recognitionStartingRef.current = false;

      recognitionRunningRef.current = true;

      setIsListening(true);
    };

    // =========================
    // ON RESULT
    // =========================

    recognition.onresult = async (event) => {
      if (!mountedRef.current) return;

      if (isSpeakingRef.current) return;

      if (processingCommandRef.current) return;

      if (mediaModeRef.current) return;

      const lastIndex =
        event.results.length - 1;

      const result =
        event.results[lastIndex];

      if (!result) return;

      const transcript =
        result[0]?.transcript?.trim();

      if (!transcript) return;

      processingCommandRef.current = true;

      setIsProcessing(true);

      stopRecognition();

      try {
        await handleCommand(transcript);
      } catch {
        processingCommandRef.current = false;

        setIsProcessing(false);

        restartRecognition(800);
      }
    };

    // =========================
    // ON ERROR
    // =========================

    recognition.onerror = (event) => {
      recognitionRunningRef.current = false;

      recognitionStartingRef.current = false;

      if (!mountedRef.current) return;

      if (
        event.error ===
          "not-allowed" ||
        event.error ===
          "service-not-allowed"
      ) {
        shouldContinueRef.current = false;

        setIsListening(false);

        return;
      }

      if (!mediaModeRef.current) {
        restartRecognition(
          event.error === "network"
            ? 1500
            : 700
        );
      }
    };

    // =========================
    // ON END
    // =========================

    recognition.onend = () => {
      recognitionRunningRef.current = false;

      recognitionStartingRef.current = false;

      setIsListening(false);

      if (!mountedRef.current) return;

      if (!shouldContinueRef.current) return;

      if (isSpeakingRef.current) return;

      if (processingCommandRef.current) return;

      if (mediaModeRef.current) return;

      restartRecognition(700);
    };

    // =========================
    // START
    // =========================

    shouldContinueRef.current = true;

    const timer = setTimeout(() => {
      startRecognition();
    }, 800);

    // =========================
    // CLEANUP
    // =========================

    return () => {
      mountedRef.current = false;

      shouldContinueRef.current = false;

      clearTimeout(timer);

      clearRestartTimer();

      recognitionRunningRef.current = false;

      recognitionStartingRef.current = false;

      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;

      try {
        recognition.stop();
      } catch {}

      window.speechSynthesis.cancel();

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}

        playerRef.current = null;
      }

      recognitionRef.current = null;
    };
  }, [
    serverUrl,
    userData?.assistantName,
  ]);

  // =========================
  // FORCE STOP LUCY
  // =========================

  const forceStopLucy = () => {
    shouldContinueRef.current = false;

    processingCommandRef.current = false;

    isSpeakingRef.current = false;

    mediaModeRef.current = true;

    clearRestartTimer();

    stopRecognition();

    window.speechSynthesis.cancel();

    setIsListening(false);

    setIsProcessing(false);

    setIsSpeaking(false);
  };

  // =========================
  // ACTIVATE LUCY
  // =========================

  const activateLucy = () => {
    shouldContinueRef.current = true;

    processingCommandRef.current = false;

    mediaModeRef.current = false;

    setIsProcessing(false);

    startRecognition();
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = async () => {
    try {
      shouldContinueRef.current = false;

      stopRecognition();

      window.speechSynthesis.cancel();

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}

        playerRef.current = null;
      }

      await axios.get(
        `${serverUrl}/api/auth/logout`,
        {
          withCredentials: true,
        }
      );

      setUserData(null);

      navigate("/signup");
    } catch {
      setUserData(null);

      navigate("/signup");
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="w-full h-screen overflow-hidden bg-gradient-to-br from-black via-[#05052d] to-[#000000] relative">

      {/* =========================
          CUSTOMIZE
      ========================= */}

      <button
        onClick={() =>
          navigate("/customize")
        }
        className="absolute top-6 left-6 z-[100] px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold backdrop-blur-md transition-all"
      >
        Customize
      </button>

      {/* =========================
          LOGOUT
      ========================= */}

      <button
        onClick={handleLogout}
        className="absolute top-6 right-6 z-[100] px-6 py-3 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-white font-semibold backdrop-blur-md transition-all"
      >
        Log Out
      </button>

      {/* =========================
          MAIN ASSISTANT
      ========================= */}

      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${
          youtubeVideoId ||
          imageResults.length > 0
            ? "mr-[50%]"
            : ""
        }`}
      >
        {/* ASSISTANT IMAGE */}

        <div className="w-[280px] h-[380px] overflow-hidden rounded-3xl border border-white/20 shadow-2xl bg-black/30">
          <img
            src={userData?.assistantImage}
            alt="Assistant"
            className="w-full h-full object-cover"
          />
        </div>

        {/* ASSISTANT NAME */}

        <h1 className="mt-6 text-white text-3xl font-bold">
          I'm{" "}
          <span className="text-blue-400">
            {userData?.assistantName ||
              "Lucy"}
          </span>
        </h1>

        {/* STATUS */}

        <div className="mt-5 flex items-center gap-3 text-gray-300">
          <div
            className={`w-3 h-3 rounded-full ${
              isSpeaking
                ? "bg-purple-400 animate-pulse"
                : youtubePlaying
                ? "bg-green-400 animate-pulse"
                : isProcessing
                ? "bg-blue-400 animate-pulse"
                : isListening
                ? "bg-green-400 animate-pulse"
                : "bg-gray-500"
            }`}
          />

          <span>
            {isSpeaking
              ? "Lucy is speaking..."
              : youtubePlaying
              ? "Music playing — voice paused"
              : isProcessing
              ? "Processing..."
              : isListening
              ? "Listening..."
              : "Voice stopped"}
          </span>
        </div>

        {/* ACTIVATE */}

        {!isListening && (
          <button
            onClick={activateLucy}
            className="mt-5 px-6 py-3 rounded-full bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/30 text-blue-200 transition-all"
          >
            🎤 Activate Lucy
          </button>
        )}

        {/* STOP */}

        {isListening && (
          <button
            onClick={forceStopLucy}
            className="mt-5 px-6 py-3 rounded-full bg-red-500/20 hover:bg-red-500/40 border border-red-400/30 text-red-200 transition-all"
          >
            ⏹ Stop Lucy
          </button>
        )}
      </div>

      {/* =====================================================
          YOUTUBE PLAYER
      ===================================================== */}

      {youtubeVideoId && (
        <div className="absolute right-5 top-1/2 -translate-y-1/2 w-[47%] max-w-[900px] z-50">
          <div className="rounded-2xl overflow-hidden border border-white/20 bg-black shadow-2xl">

            {/* VIDEO */}

            <div className="aspect-video bg-black">
              <div
                ref={playerContainerRef}
                className="w-full h-full"
              />
            </div>

            {/* PLAYER INFO */}

            <div className="p-5 bg-black/90">
              <p className="text-white font-semibold truncate">
                {youtubeTitle ||
                  "YouTube"}
              </p>

              <p className="text-gray-400 text-sm mt-1">
                {youtubePlaying
                  ? "Playing"
                  : "Paused"}
              </p>

              {/* ACTIVATE */}

              <button
                onClick={activateLucy}
                className="mt-4 w-full px-5 py-3 rounded-full bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/30 text-blue-200 transition-all"
              >
                🎤 Activate Lucy
              </button>

              {/* CLOSE */}

              <button
                onClick={closeVideo}
                className="mt-3 w-full px-5 py-3 rounded-full bg-red-500/20 hover:bg-red-500/40 border border-red-400/30 text-red-200 transition-all"
              >
                Close YouTube
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          IMAGE RESULTS
      ===================================================== */}

      {imageResults.length > 0 && (
        <div className="absolute right-5 top-1/2 -translate-y-1/2 w-[47%] max-w-[900px] h-[78vh] z-50 rounded-2xl overflow-hidden border border-white/20 bg-black/95 shadow-2xl">

          {/* HEADER */}

          <div className="px-5 py-4 border-b border-white/10">
            <p className="text-white font-semibold">
              Image Results
            </p>

            <p className="text-gray-400 text-sm truncate">
              {imageQuery}
            </p>

            <button
              onClick={closeImages}
              className="mt-3 px-4 py-2 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-400/20 text-red-200 text-sm"
            >
              Close Images
            </button>
          </div>

          {/* IMAGES */}

          <div className="grid grid-cols-2 gap-3 p-4 overflow-y-auto h-[calc(78vh-105px)]">
            {imageResults.map(
              (image, index) => (
                <a
                  key={
                    image.id ||
                    `${image.link}-${index}`
                  }
                  href={
                    image.contextLink ||
                    image.link ||
                    "#"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-blue-400/60 hover:scale-[1.02] transition-all"
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
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />

                  <div className="p-2">
                    <p className="text-white text-xs line-clamp-2">
                      {image.title ||
                        "Image"}
                    </p>

                    {image.source && (
                      <p className="text-gray-500 text-[10px] mt-1">
                        {image.source}
                      </p>
                    )}
                  </div>
                </a>
              )
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          BOTTOM STATUS
      ===================================================== */}

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[100]">

        {/* YOUTUBE STATUS */}

        {youtubeVideoId && (
          <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-black/80 border border-white/10 backdrop-blur-md">

            <span
              className={`w-2.5 h-2.5 rounded-full ${
                youtubePlaying
                  ? "bg-green-400 animate-pulse"
                  : "bg-yellow-400"
              }`}
            />

            <span className="text-gray-200 text-sm">
              {youtubePlaying
                ? "Music playing"
                : "Music paused"}
            </span>

            <span className="text-gray-500 text-xs">
              Voice paused
            </span>
          </div>
        )}

        {/* IMAGE STATUS */}

        {!youtubeVideoId &&
          imageResults.length > 0 && (
            <div className="px-5 py-3 rounded-full bg-black/80 border border-white/10 backdrop-blur-md text-gray-300 text-sm">
              Say "Lucy close images"
            </div>
          )}
      </div>
    </div>
  );
}

export default Home;