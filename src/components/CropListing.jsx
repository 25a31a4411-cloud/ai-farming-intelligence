import React, { useState } from "react";

function CropListing({
  farmingData,
  setFarmingData,
  onBack,
  onAnalyze,
}) {
  const existingCrop = farmingData.cropListing || {};

  const [crop, setCrop] = useState(existingCrop.crop || "");
  const [quantity, setQuantity] = useState(
    String(existingCrop.quantity || "")
  );
  const [quality, setQuality] = useState(
    existingCrop.quality || "A Grade"
  );
  const [harvestDate, setHarvestDate] = useState(
    existingCrop.harvestDate || ""
  );
  const [location, setLocation] = useState(
    existingCrop.location || ""
  );

  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");

  const speechLanguages = {
    en: "en-IN",
    te: "te-IN",
    hi: "hi-IN",
    mr: "mr-IN",
    kn: "kn-IN",
    ta: "ta-IN",
  };

  const startVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Voice input is not supported in this browser. Please use Chrome or enter the details manually."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang =
      speechLanguages[farmingData.farmer?.language] || "en-IN";

    recognition.continuous = false;
    recognition.interimResults = false;

    setListening(true);
    setError("");

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;

      setVoiceText(text);
      processVoiceInput(text);
    };

    recognition.onerror = () => {
      setListening(false);

      setError(
        "Voice input could not be understood. Please try again or enter the details manually."
      );
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  const processVoiceInput = (text) => {
    const lowerText = text.toLowerCase();

    const cropNames = [
      "tomato",
      "rice",
      "paddy",
      "wheat",
      "maize",
      "corn",
      "chilli",
      "chili",
      "cotton",
      "groundnut",
      "potato",
      "onion",
    ];

    const detectedCrop = cropNames.find((name) =>
      lowerText.includes(name)
    );

    if (detectedCrop) {
      let formattedCrop =
        detectedCrop.charAt(0).toUpperCase() +
        detectedCrop.slice(1);

      if (detectedCrop === "paddy") {
        formattedCrop = "Paddy";
      }

      if (detectedCrop === "chili") {
        formattedCrop = "Chilli";
      }

      setCrop(formattedCrop);
    }

    const quantityMatch = lowerText.match(
      /(\d+(?:\.\d+)?)\s*(kg|kgs|kilogram|kilograms)/
    );

    if (quantityMatch) {
      setQuantity(quantityMatch[1]);
    } else {
      const numberMatch = lowerText.match(
        /\b\d+(?:\.\d+)?\b/
      );

      if (numberMatch) {
        setQuantity(numberMatch[0]);
      }
    }

    if (
      lowerText.includes("a grade") ||
      lowerText.includes("grade a")
    ) {
      setQuality("A Grade");
    } else if (
      lowerText.includes("b grade") ||
      lowerText.includes("grade b")
    ) {
      setQuality("B Grade");
    } else if (
      lowerText.includes("c grade") ||
      lowerText.includes("grade c")
    ) {
      setQuality("C Grade");
    } else if (lowerText.includes("mixed")) {
      setQuality("Mixed Grade");
    }

    const locations = [
      "pithapuram",
      "kakinada",
      "samalkota",
      "rajahmundry",
      "vijayawada",
      "visakhapatnam",
      "vizag",
    ];

    const detectedLocation = locations.find((place) =>
      lowerText.includes(place)
    );

    if (detectedLocation) {
      if (detectedLocation === "vizag") {
        setLocation("Visakhapatnam");
      } else {
        setLocation(
          detectedLocation.charAt(0).toUpperCase() +
            detectedLocation.slice(1)
        );
      }
    }

    setSaved(false);
    setError("");
  };

  const handleSaveListing = () => {
    if (
      !crop.trim() ||
      !quantity ||
      Number(quantity) <= 0 ||
      !harvestDate ||
      !location.trim()
    ) {
      setError(
        "Please complete crop, quantity, harvest date and location."
      );
      setSaved(false);
      return;
    }

    const updatedCropListing = {
      ...existingCrop,
      crop: crop.trim(),
      quantity: Number(quantity),
      unit: "kg",
      quality,
      harvestDate,
      location: location.trim(),
      status: "Ready for Analysis",
    };

    setFarmingData((previousData) => ({
      ...previousData,
      cropListing: updatedCropListing,
      farmer: {
        ...previousData.farmer,
        location: location.trim(),
      },
    }));

    setError("");
    setSaved(true);
  };

  const handleAnalyze = () => {
    if (!saved) {
      setError("Please save your crop listing first.");
      return;
    }

    onAnalyze();
  };

  return (
    <div className="dashboard">

      <header className="dashboard-header">
        <div>
          <p className="welcome-text">
            🌾 Farmer Workspace
          </p>

          <h1>Create Crop Listing</h1>

          <p className="dashboard-subtitle">
            Enter your actual crop details for AI selling analysis.
          </p>
        </div>
      </header>

      <section className="dashboard-card crop-form-card">

        <div className="section-heading">
          <span className="card-icon">📝</span>

          <div>
            <h2>Crop Information</h2>

            <p>
              Enter details manually or use voice input.
            </p>
          </div>
        </div>

        {/* VOICE */}
        <div className="voice-card">

          <div className="voice-card-header">

            <div className="voice-icon">
              🎙️
            </div>

            <div>
              <h3>Voice Crop Entry</h3>

              <p>
                Speak your crop, quantity, quality and location.
              </p>
            </div>

          </div>

          <div className="voice-example">
            Example: "Tomato, 1000 kilograms, A Grade, Pithapuram"
          </div>

          <button
            type="button"
            className="voice-button"
            onClick={startVoiceInput}
            disabled={listening}
          >
            {listening
              ? "🎙️ Listening..."
              : "🎤 Speak Crop Details"}
          </button>

          {voiceText && (
            <div className="voice-result">
              <strong>Heard:</strong> {voiceText}
            </div>
          )}

        </div>

        {/* CROP */}
        <div className="form-group">

          <label htmlFor="crop-name">
            Crop Name
          </label>

          <input
            id="crop-name"
            type="text"
            value={crop}
            placeholder="Example: Tomato"
            onChange={(event) => {
              setCrop(event.target.value);
              setSaved(false);
              setError("");
            }}
          />

        </div>

        {/* QUANTITY */}
        <div className="form-group">

          <label htmlFor="crop-quantity">
            Quantity (kg)
          </label>

          <input
            id="crop-quantity"
            type="number"
            min="1"
            value={quantity}
            placeholder="Example: 1000"
            onChange={(event) => {
              setQuantity(event.target.value);
              setSaved(false);
              setError("");
            }}
          />

        </div>

        {/* QUALITY */}
        <div className="form-group">

          <label htmlFor="crop-quality">
            Quality Grade
          </label>

          <select
            id="crop-quality"
            value={quality}
            onChange={(event) => {
              setQuality(event.target.value);
              setSaved(false);
              setError("");
            }}
          >
            <option value="A Grade">A Grade</option>
            <option value="B Grade">B Grade</option>
            <option value="C Grade">C Grade</option>
            <option value="Mixed Grade">Mixed Grade</option>
            <option value="Not Assessed">
              Not Assessed
            </option>
          </select>

        </div>

        {/* HARVEST DATE */}
        <div className="form-group">

          <label htmlFor="harvest-date">
            Expected Harvest Date
          </label>

          <input
            id="harvest-date"
            type="date"
            value={harvestDate}
            onChange={(event) => {
              setHarvestDate(event.target.value);
              setSaved(false);
              setError("");
            }}
          />

        </div>

        {/* LOCATION */}
        <div className="form-group">

          <label htmlFor="crop-location">
            Crop Location
          </label>

          <input
            id="crop-location"
            type="text"
            value={location}
            placeholder="Example: Pithapuram"
            onChange={(event) => {
              setLocation(event.target.value);
              setSaved(false);
              setError("");
            }}
          />

        </div>

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        {saved && (
          <div className="success-message">

            <strong>
              ✓ Crop listing saved successfully
            </strong>

            <p>
              Your actual crop data is ready for AI
              market and buyer analysis.
            </p>

          </div>
        )}

        {!saved ? (
          <button
            className="primary-button"
            onClick={handleSaveListing}
          >
            💾 Save Crop Listing
          </button>
        ) : (
          <button
            className="primary-button"
            onClick={handleAnalyze}
          >
            🤖 Analyze Markets & Buyers →
          </button>
        )}

        <button
          className="back-button"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>

      </section>

    </div>
  );
}

export default CropListing;