import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

/* =========================================================
   AI FARMING SELLING INTELLIGENCE
   FINAL HACKATHON PROTOTYPE
========================================================= */

/* =========================================================
   TRANSLATIONS
========================================================= */

const translations = {
  English: {
    appName: "AI Farming Selling Intelligence",
    tagline: "Sell Smarter. Earn Better.",
    getStarted: "Get Started",
    chooseLanguage: "Choose Your Language",
    chooseRole: "Select Your Role",
    login: "Login / Registration",
    enterApplication: "Enter Application",
    dashboard: "Dashboard",
    back: "Back",
    logout: "Logout",
    online: "Online",
    offline: "Offline",
    continue: "Continue",

    farmer: "Farmer",
    buyer: "Buyer",
    fpo: "FPO / Cooperative",

    name: "Name",
    contact: "Mobile Number / Email",
    password: "Password",

    cropName: "Crop Name",
    quantity: "Available Quantity (kg)",
    location: "Location",
    harvestDate: "Harvest Date",
    quality: "Quality",
    expectedPrice: "Expected Price per kg",

    requiredCrop: "Required Crop",
    requiredQuantity: "Required Quantity (kg)",
    deliveryLocation: "Delivery Location",
    requiredDate: "Required Date",
    requiredQuality: "Required Quality",

    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    update: "Update",
    voiceInput: "Voice Input",
    listening: "Listening...",
    buyNow: "Buy Now",
    askQuestion: "Ask Question",
    transaction: "Transaction",
  },

  Telugu: {
    appName: "ఏఐ వ్యవసాయ విక్రయ మేధస్సు",
    tagline: "తెలివిగా అమ్మండి. ఎక్కువ సంపాదించండి.",
    getStarted: "ప్రారంభించండి",
    chooseLanguage: "మీ భాషను ఎంచుకోండి",
    chooseRole: "మీ పాత్రను ఎంచుకోండి",
    login: "లాగిన్ / నమోదు",
    enterApplication: "అప్లికేషన్‌లోకి ప్రవేశించండి",
    dashboard: "డాష్‌బోర్డ్",
    back: "వెనుకకు",
    logout: "లాగ్అవుట్",
    online: "ఆన్‌లైన్",
    offline: "ఆఫ్‌లైన్",
    continue: "కొనసాగించండి",

    farmer: "రైతు",
    buyer: "కొనుగోలుదారు",
    fpo: "ఎఫ్‌పీఓ / సహకార సంఘం",

    name: "పేరు",
    contact: "మొబైల్ నంబర్ / ఇమెయిల్",
    password: "పాస్‌వర్డ్",

    cropName: "పంట పేరు",
    quantity: "అందుబాటులో ఉన్న పరిమాణం (కిలోలు)",
    location: "ప్రాంతం",
    harvestDate: "పంట కోత తేదీ",
    quality: "నాణ్యత",
    expectedPrice: "అంచనా ధర కిలోకు",

    requiredCrop: "అవసరమైన పంట",
    requiredQuantity: "అవసరమైన పరిమాణం (కిలోలు)",
    deliveryLocation: "డెలివరీ ప్రాంతం",
    requiredDate: "అవసరమైన తేదీ",
    requiredQuality: "అవసరమైన నాణ్యత",

    edit: "సవరించు",
    save: "సేవ్ చేయండి",
    cancel: "రద్దు",
    update: "నవీకరించు",
    voiceInput: "వాయిస్ ఇన్‌పుట్",
    listening: "వింటోంది...",
    buyNow: "ఇప్పుడే కొనండి",
    askQuestion: "ప్రశ్న అడగండి",
    transaction: "లావాదేవీ",
  },

  Hindi: {
    appName: "एआई कृषि बिक्री बुद्धिमत्ता",
    tagline: "समझदारी से बेचें। अधिक कमाएं।",
    getStarted: "शुरू करें",
    chooseLanguage: "अपनी भाषा चुनें",
    chooseRole: "अपनी भूमिका चुनें",
    login: "लॉगिन / पंजीकरण",
    enterApplication: "एप्लिकेशन में प्रवेश करें",
    dashboard: "डैशबोर्ड",
    back: "वापस",
    logout: "लॉगआउट",
    online: "ऑनलाइन",
    offline: "ऑफलाइन",
    continue: "जारी रखें",

    farmer: "किसान",
    buyer: "खरीदार",
    fpo: "एफपीओ / सहकारी समिति",

    name: "नाम",
    contact: "मोबाइल नंबर / ईमेल",
    password: "पासवर्ड",

    cropName: "फसल का नाम",
    quantity: "उपलब्ध मात्रा (किलो)",
    location: "स्थान",
    harvestDate: "कटाई की तारीख",
    quality: "गुणवत्ता",
    expectedPrice: "प्रति किलो अपेक्षित मूल्य",

    requiredCrop: "आवश्यक फसल",
    requiredQuantity: "आवश्यक मात्रा (किलो)",
    deliveryLocation: "डिलीवरी स्थान",
    requiredDate: "आवश्यक तारीख",
    requiredQuality: "आवश्यक गुणवत्ता",

    edit: "संपादित करें",
    save: "सेव करें",
    cancel: "रद्द करें",
    update: "अपडेट करें",
    voiceInput: "वॉयस इनपुट",
    listening: "सुन रहा है...",
    buyNow: "अभी खरीदें",
    askQuestion: "प्रश्न पूछें",
    transaction: "लेनदेन",
  },

  Marathi: {
    appName: "एआय कृषी विक्री बुद्धिमत्ता",
    tagline: "हुशारीने विक्री करा. अधिक कमवा.",
    getStarted: "सुरू करा",
    chooseLanguage: "तुमची भाषा निवडा",
    chooseRole: "तुमची भूमिका निवडा",
    login: "लॉगिन / नोंदणी",
    enterApplication: "अॅपमध्ये प्रवेश करा",
    dashboard: "डॅशबोर्ड",
    back: "मागे",
    logout: "लॉगआउट",
    online: "ऑनलाइन",
    offline: "ऑफलाइन",
    continue: "पुढे जा",

    farmer: "शेतकरी",
    buyer: "खरेदीदार",
    fpo: "एफपीओ / सहकारी संस्था",

    name: "नाव",
    contact: "मोबाईल नंबर / ईमेल",
    password: "पासवर्ड",

    cropName: "पिकाचे नाव",
    quantity: "उपलब्ध प्रमाण (किलो)",
    location: "स्थान",
    harvestDate: "काढणीची तारीख",
    quality: "गुणवत्ता",
    expectedPrice: "प्रति किलो अपेक्षित किंमत",

    requiredCrop: "आवश्यक पीक",
    requiredQuantity: "आवश्यक प्रमाण (किलो)",
    deliveryLocation: "वितरण स्थान",
    requiredDate: "आवश्यक तारीख",
    requiredQuality: "आवश्यक गुणवत्ता",

    edit: "संपादित करा",
    save: "जतन करा",
    cancel: "रद्द करा",
    update: "अपडेट करा",
    voiceInput: "व्हॉइस इनपुट",
    listening: "ऐकत आहे...",
    buyNow: "आता खरेदी करा",
    askQuestion: "प्रश्न विचारा",
    transaction: "व्यवहार",
  },
};

/* =========================================================
   INITIAL DATA
========================================================= */

const initialLots = [
  {
    id: 1,
    crop: "Tomato",
    quantity: 2000,
    location: "Kakinada",
    harvest: "2026-09-08",
    quality: "A Grade",
    aiGrade: "A Grade",
    price: 24,
    farmer: "Farmer A",
    phone: "9876543210",
    ownerId: "demo-farmer-a",
    image: "",
    status: "Available",
  },
  {
    id: 2,
    crop: "Tomato",
    quantity: 3000,
    location: "Pithapuram",
    harvest: "2026-09-09",
    quality: "A Grade",
    aiGrade: "A Grade",
    price: 23,
    farmer: "Farmer B",
    phone: "9876500000",
    ownerId: "demo-farmer-b",
    image: "",
    status: "Available",
  },
  {
    id: 3,
    crop: "Tomato",
    quantity: 5000,
    location: "Samalkota",
    harvest: "2026-09-10",
    quality: "A Grade",
    aiGrade: "A Grade",
    price: 25,
    farmer: "Farmer C",
    phone: "9876111111",
    ownerId: "demo-farmer-c",
    image: "",
    status: "Available",
  },
];

const initialCustomers = [
  {
    id: 1,
    customer: "Kakinada Fresh Mart",
    transactions: 14,
    completed: 13,
    disputed: 1,
    paymentScore: 93,
    reliability: "High",
  },
  {
    id: 2,
    customer: "East Godavari Foods",
    transactions: 8,
    completed: 6,
    disputed: 2,
    paymentScore: 75,
    reliability: "Medium",
  },
  {
    id: 3,
    customer: "Coastal Traders",
    transactions: 5,
    completed: 3,
    disputed: 2,
    paymentScore: 55,
    reliability: "Low",
  },
];

const initialTransactions = [
  {
    id: "TXN-1001",
    customer: "Kakinada Fresh Mart",
    farmer: "Demo Farmer",
    crop: "Tomato",
    quantity: 2000,
    amount: 48000,
    paymentMethod: "UPI",
    status: "Order Received",
    paymentStatus: "Payment Pending",
    deliveryMode: "Buyer Pickup",
    cropAmount: 48000,
    transportCharge: 0,
    farmerNetReturn: 46600,
    date: "2026-08-20",
    demoRecord: true,
  },
];

function calculateDistanceKm(pointA, pointB) {
  if (!pointA || !pointB) return null;
  const lat1 = Number(pointA.latitude ?? pointA.lat);
  const lon1 = Number(pointA.longitude ?? pointA.lng);
  const lat2 = Number(pointB.latitude ?? pointB.lat);
  const lon2 = Number(pointB.longitude ?? pointB.lng);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;
  const radians = (degrees) => degrees * Math.PI / 180;
  const earthRadiusKm = 6371;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

// Prototype estimate only. Replace this formula with a verified logistics quote in production.
function estimateTransportCharge(distanceKm, quantityKg) {
  return Math.max(0, Math.round(Number(distanceKm || 0) * Number(quantityKg || 0) * 0.03));
}

/* =========================================================
   REUSABLE COMPONENTS
   ALL OUTSIDE APP()
   THIS HELPS PREVENT FOCUS LOSS
========================================================= */

const Button = ({
  children,
  onClick,
  className = "",
  type = "button",
  disabled = false,
}) => {
  return (
    <button
      type={type}
      className={`btn ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }) => {
  return <div className={`card ${className}`}>{children}</div>;
};

const Input = ({ label, ...props }) => {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <input {...props} />
    </div>
  );
};

const Select = ({ label, children, ...props }) => {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <select {...props}>{children}</select>
    </div>
  );
};

const TextArea = ({ label, ...props }) => {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <textarea {...props} />
    </div>
  );
};

/* =========================================================
   VOICE INPUT
========================================================= */

function VoiceInput({ onResult, language = "English", buttonText }) {
  const [listening, setListening] = useState(false);

  const languageMap = {
    English: "en-IN",
    Telugu: "te-IN",
    Hindi: "hi-IN",
    Marathi: "mr-IN",
  };

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = languageMap[language] || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);

    recognition.onend = () => setListening(false);

    recognition.onerror = () => setListening(false);

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    recognition.start();
  }

  return (
    <Button
      className={listening ? "danger" : "secondary"}
      onClick={startListening}
    >
      🎤 {listening ? "Listening..." : buttonText || "Voice Input"}
    </Button>
  );
}

/* =========================================================
   EXPLAINABLE AI VOICE
========================================================= */

function AIVoiceExplanation({ text, language }) {
  function speak() {
    if (!window.speechSynthesis) {
      alert("Voice explanation is not supported in this browser.");
      return;
    }

    const languageMap = {
      English: "en-IN",
      Telugu: "te-IN",
      Hindi: "hi-IN",
      Marathi: "mr-IN",
    };

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = languageMap[language] || "en-IN";

    window.speechSynthesis.speak(utterance);
  }

  return (
    <Button className="secondary" onClick={speak}>
      🔊 AI Voice Explanation
    </Button>
  );
}

/* =========================================================
   LAYOUT
   OUTSIDE APP() TO PREVENT REMOUNTING
========================================================= */

function Layout({
  title,
  children,
  showNavigation = true,
  loggedIn,
  appName,
  userName,
  role,
  online,
  onlineText,
  offlineText,
  dashboardText,
  backText,
  historyLength,
  onDashboard,
  onBack,
}) {
  return (
    <main className="app">
      {loggedIn && (
        <header className="topbar">
          <div>
            <h2>🌾 {appName}</h2>

            <small>
              {userName} • {role}
            </small>
          </div>

          <div className="top-info">
            <span className={online ? "online" : "offline"}>
              ● {online ? onlineText : offlineText}
            </span>

            <Button className="secondary" onClick={onDashboard}>
              🏠 {dashboardText}
            </Button>
          </div>
        </header>
      )}

      <section className="content">
        <h1>{title}</h1>
        {children}
      </section>

      {showNavigation && loggedIn && historyLength > 0 && (
        <footer className="navigation">
          <Button className="secondary" onClick={onBack}>
            ← {backText}
          </Button>

          <Button onClick={onDashboard}>
            🏠 {dashboardText}
          </Button>
        </footer>
      )}
    </main>
  );
}

/* =========================================================
   MAIN APP
========================================================= */

function App() {
  const [page, setPage] = useState("splash");
  const [history, setHistory] = useState([]);

  const [language, setLanguage] = useState("English");
  const [role, setRole] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const [userName, setUserName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("Location not captured");
  const [codEnabled, setCodEnabled] = useState(() => {
    try { return localStorage.getItem("farmerCodEnabled") !== "false"; } catch { return true; }
  });
  const [isRecording, setIsRecording] = useState(false);
  const [videoEvidence, setVideoEvidence] = useState("");
  const [storagePlan, setStoragePlan] = useState({ days: "3", futurePrice: "30", dailyCost: "0.8", spoilagePercent: "3", handlingCostPerKg: "0.2" });
  const mediaRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);

  const [online, setOnline] = useState(true);

  const [lots, setLots] = useState(initialLots);
  const [selectedLot, setSelectedLot] = useState(null);

  const [customers] = useState(initialCustomers);
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem("farmingTransactions");
      const loaded = saved ? JSON.parse(saved) : initialTransactions;
      // TXN-1001 is a seeded demo row, not a real payment receipt.
      return Array.isArray(loaded) ? loaded.map((item) => item.id === "TXN-1001" && item.demoRecord !== false ? {
        ...item,
        status: "Order Received",
        paymentStatus: "Payment Pending",
        paymentMethod: item.paymentMethod || "UPI",
        deliveryMode: item.deliveryMode || "Buyer Pickup",
        cropAmount: Number(item.cropAmount ?? item.amount ?? 0),
        transportCharge: Number(item.transportCharge || 0),
        amount: Number(item.cropAmount ?? item.amount ?? 0),
        demoRecord: true,
      } : item) : initialTransactions;
    } catch {
      return initialTransactions;
    }
  });

  const [loginHistory, setLoginHistory] = useState([]);

  const [cropForm, setCropForm] = useState({
    crop: "",
    quantity: "",
    location: "",
    harvest: "",
    quality: "A Grade",
    price: "",
    image: "",
    videoEvidence: "",
    gpsCoordinates: null,
    gpsCapturedAt: "",
    aiGrade: "",
  });

  const [editingLotId, setEditingLotId] = useState(null);

  const [requirement, setRequirement] = useState(() => {
    try {
      const saved = localStorage.getItem("farmingBuyerRequirement");
      return saved ? JSON.parse(saved) : { crop: "Tomato", quantity: "10000", location: "", gpsCoordinates: null, date: "", quality: "A Grade", buyerName: "", buyerContact: "" };
    } catch {
      return { crop: "Tomato", quantity: "10000", location: "", gpsCoordinates: null, date: "", quality: "A Grade", buyerName: "", buyerContact: "" };
    }
  });

  const [requirementEditing, setRequirementEditing] = useState(true);

  const [confirmedIds, setConfirmedIds] = useState([]);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);

  const [marketUpdated, setMarketUpdated] = useState(false);

  // Farmer Smart Center tools. These are local prototype inputs; live services
  // (weather, mandi feeds and image-based diagnosis) need configured APIs.
  const [doctorCrop, setDoctorCrop] = useState("Tomato");
  const [doctorSymptoms, setDoctorSymptoms] = useState("Yellow leaves");
  const [doctorQuestion, setDoctorQuestion] = useState("");
  const [doctorAnswer, setDoctorAnswer] = useState("");
  const [doctorImage, setDoctorImage] = useState("");
  const [doctorAnalysis, setDoctorAnalysis] = useState(null);
  const [farmLocation, setFarmLocation] = useState("");
  const [farmTemperature, setFarmTemperature] = useState("30");
  const [farmRainChance, setFarmRainChance] = useState("20");
  const [farmHumidity, setFarmHumidity] = useState("60");
  const [mandiCrop, setMandiCrop] = useState("Tomato");
  const [mandiRates, setMandiRates] = useState({ local: "24", nearby: "27", distant: "29", transport: "2" });
  const [farmExpenses, setFarmExpenses] = useState({ seeds: "1500", fertilizer: "3000", labour: "5000", water: "1000", transport: "1200", other: "500", quantity: "1000", salePrice: "25" });
  const [waterCrop, setWaterCrop] = useState("Rice");
  const [waterSoil, setWaterSoil] = useState("Moist");
  const [waterStage, setWaterStage] = useState("Vegetative");
  const [farmNotes, setFarmNotes] = useState(() => {
    try { return localStorage.getItem("aiFarmingOfflineNotes") || ""; } catch { return ""; }
  });

  const [deliveryMode, setDeliveryMode] = useState("Buyer Pickup");
  const [deliveryDistance, setDeliveryDistance] = useState(18);

  const [paymentStatus, setPaymentStatus] =
    useState("Payment Pending");

  const [orderStatus, setOrderStatus] =
    useState("Order Received");

  const [trackingProgress, setTrackingProgress] =
    useState(25);

  const [buyerOffer, setBuyerOffer] = useState({
    amount: "",
    quantity: "",
    deliveryLocation: "",
  });

  const [transactionDetails, setTransactionDetails] =
    useState({
      buyerName: "",
      phone: "",
      address: "",
      paymentMethod: "",
    });

  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const t = translations[language];

  useEffect(() => () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
  }, []);

  // Refresh GPS automatically on farmer/buyer workspaces and order screens.
  useEffect(() => {
    if (!["crop-listing", "farmer-dashboard", "buyer-dashboard", "orders", "payments", "transaction-details", "notifications", "logistics"].includes(page) || !navigator.geolocation) return;
    setGpsStatus("Updating current GPS location…");
    navigator.geolocation.getCurrentPosition((position) => {
      const coords = { latitude: Number(position.coords.latitude.toFixed(6)), longitude: Number(position.coords.longitude.toFixed(6)), accuracy: Math.round(position.coords.accuracy) };
      setGpsCoordinates(coords);
      setGpsStatus(`GPS updated ±${coords.accuracy} m`);
      setCropForm((previous) => ({ ...previous, location: `GPS ${coords.latitude}, ${coords.longitude}`, gpsCoordinates: coords, gpsCapturedAt: new Date().toISOString() }));
      setTransactionDetails((previous) => ({ ...previous, address: previous.address || `GPS ${coords.latitude}, ${coords.longitude}` }));
      if (role === "Buyer") {
        setRequirement((previous) => ({ ...previous, location: `GPS ${coords.latitude}, ${coords.longitude}`, gpsCoordinates: coords, buyerName: userName || previous.buyerName, buyerContact: contact || previous.buyerContact }));
      }
    }, (error) => {
      setGpsStatus(error.code === 1 ? "Location permission denied — required to list" : "GPS unavailable — enable device location");
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }, [page, role, userName, contact]);

  /* =======================================================
     SESSION RESTORE
  ======================================================= */

  useEffect(() => {
    try {
      localStorage.setItem("farmingTransactions", JSON.stringify(transactions));
    } catch {
      // Keep the prototype usable if browser storage is unavailable.
    }
  }, [transactions]);

  useEffect(() => {
    try { localStorage.setItem("farmerCodEnabled", String(codEnabled)); } catch { /* best-effort browser persistence */ }
  }, [codEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem("farmingBuyerRequirement", JSON.stringify(requirement));
    } catch {
      // Requirement persistence is best-effort in this browser-only prototype.
    }
  }, [requirement]);

  useEffect(() => {
    const savedSession = localStorage.getItem("aiFarmingSession");

    if (!savedSession) return;

    try {
      const session = JSON.parse(savedSession);

      setLanguage(session.language || "English");
      setRole(session.role || "");
      setUserName(session.userName || "");
      setContact(session.contact || "");
      setLoggedIn(true);

      if (session.role === "Farmer") {
        setPage("farmer-dashboard");
      } else if (session.role === "Buyer") {
        setPage("buyer-dashboard");
      } else if (session.role === "FPO") {
        setPage("fpo-dashboard");
      }
    } catch {
      localStorage.removeItem("aiFarmingSession");
    }
  }, []);

  /* =======================================================
     NAVIGATION
  ======================================================= */

  function getDashboard() {
    if (role === "Farmer") return "farmer-dashboard";
    if (role === "Buyer") return "buyer-dashboard";
    if (role === "FPO") return "fpo-dashboard";

    return "splash";
  }

  function navigate(nextPage) {
    setHistory((previous) => [...previous, page]);
    setPage(nextPage);
  }

  function goBack() {
    setHistory((previous) => {
      if (previous.length === 0) return previous;

      const copy = [...previous];
      const lastPage = copy.pop();

      setPage(lastPage);

      return copy;
    });
  }

  function goDashboard() {
    setHistory([]);
    setPage(getDashboard());
  }

  function logout() {
    localStorage.removeItem("aiFarmingSession");

    setLoggedIn(false);
    setRole("");
    setUserName("");
    setContact("");
    setPassword("");
    setSelectedLot(null);
    setHistory([]);
    setPage("splash");
  }

  /* =======================================================
     LAYOUT PROPS
  ======================================================= */

  const layoutProps = {
    loggedIn,
    appName: t.appName,
    userName,
    role,
    online,
    onlineText: t.online,
    offlineText: t.offline,
    dashboardText: t.dashboard,
    backText: t.back,
    historyLength: history.length,
    onDashboard: goDashboard,
    onBack: goBack,
  };

  /* =======================================================
     MY LOTS
  ======================================================= */

  const myLots = useMemo(() => {
    return lots.filter((lot) => lot.ownerId === contact);
  }, [lots, contact]);

  /* =======================================================
     ACTIVE LOT
  ======================================================= */

  const farmerActiveLot =
    selectedLot && selectedLot.ownerId === contact
      ? selectedLot
      : myLots[0] || null;

  /* =======================================================
     BUYER MATCHING
  ======================================================= */

  const matches = useMemo(() => {
    return lots.filter((lot) => {
      const cropMatch =
        lot.crop.toLowerCase() ===
        requirement.crop.toLowerCase().trim();

      const qualityMatch =
        requirement.quality === "Any Quality" ||
        lot.quality === requirement.quality;

      return (
        cropMatch &&
        qualityMatch &&
        lot.status === "Available"
      );
    });
  }, [lots, requirement]);

  const totalSupply = matches.reduce(
    (sum, lot) => sum + Number(lot.quantity),
    0
  );

  const confirmedLots = lots.filter((lot) =>
    confirmedIds.includes(lot.id)
  );

  const confirmedQuantity = confirmedLots.reduce(
    (sum, lot) => sum + Number(lot.quantity),
    0
  );

  const remainingQuantity = Math.max(
    0,
    Number(requirement.quantity) - confirmedQuantity
  );

  /* =======================================================
     NET RETURN
  ======================================================= */

  const sellingValue =
    Number(farmerActiveLot?.quantity || 0) *
    Number(farmerActiveLot?.price || 0);

  const transportationCost = Math.round(
    Number(farmerActiveLot?.quantity || 0) *
      Number(deliveryDistance || 0) *
      0.03
  );

  const storageCost = Math.round(
    Number(farmerActiveLot?.quantity || 0) * 0.3
  );

  const handlingCost = Math.round(
    Number(farmerActiveLot?.quantity || 0) * 0.2
  );

  const buyerTransportCharge = deliveryMode === "Buyer Pickup" ? 0 : transportationCost;

  // Transport is a separate buyer-paid charge when delivery is arranged.
  // Farmer net return is based on crop proceeds minus farmer-side costs.
  const estimatedNetReturn = sellingValue - storageCost - handlingCost;

  /* =======================================================
     MARKET INTELLIGENCE
  ======================================================= */

  const marketPrice = marketUpdated ? 27 : 24;
  const seasonalDemand = marketUpdated ? "High" : "Medium";

  const thresholdPrice =
    farmerActiveLot?.crop?.toLowerCase() === "tomato"
      ? 23
      : 20;

  const recommendedPrice = Math.round(
    marketPrice * 1.05
  );

  /* =======================================================
     STORAGE FEASIBILITY
  ======================================================= */

  const storageFeasibility = useMemo(() => {
    if (!farmerActiveLot) {
      return {
        score: 0,
        status: "No Crop Selected",
        recommendation: "Select a crop first.",
      };
    }

    const currentPrice = Number(farmerActiveLot.price);

    if (currentPrice < thresholdPrice) {
      return {
        score: 85,
        status: "Recommended",
        recommendation:
          "Current price is below the estimated threshold. Storage may help wait for a better market opportunity.",
      };
    }

    return {
      score: 60,
      status: "Limited Feasibility",
      recommendation:
        "Current price is at or above the threshold. Selling earlier may reduce storage cost and spoilage risk.",
    };
  }, [farmerActiveLot, thresholdPrice]);

  /* =======================================================
     STORAGE CENTERS - DEMO DATA
  ======================================================= */

  const storageCenters = [
    {
      name: "Kakinada Cold Storage Center",
      distance: "8 km",
      charge: "₹0.80/kg/day",
    },
    {
      name: "Pithapuram Agri Storage",
      distance: "15 km",
      charge: "₹0.65/kg/day",
    },
    {
      name: "Samalkota Fresh Storage",
      distance: "22 km",
      charge: "₹0.75/kg/day",
    },
  ];

  /* =======================================================
     TRANSACTION RISK
  ======================================================= */

  const transactionRisk = useMemo(() => {
    const total = customers.reduce(
      (sum, customer) => sum + customer.transactions,
      0
    );

    const completed = customers.reduce(
      (sum, customer) => sum + customer.completed,
      0
    );

    const completionRate =
      total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    let level = "High";

    if (completionRate >= 85) {
      level = "Low";
    } else if (completionRate >= 65) {
      level = "Medium";
    }

    return {
      completionRate,
      level,
    };
  }, [customers]);

  /* =======================================================
     OPPORTUNITY SCORE
  ======================================================= */

  const opportunityScore = useMemo(() => {
    if (!farmerActiveLot) return 0;

    let score = 40;

    if (farmerActiveLot.quality === "A Grade") score += 15;

    if (Number(farmerActiveLot.quantity) >= 1000) score += 12;

    if (Number(farmerActiveLot.price) >= thresholdPrice) score += 10;

    if (marketUpdated) score += 8;

    if (transactionRisk.level === "Low") score += 10;

    return Math.min(100, score);
  }, [
    farmerActiveLot,
    marketUpdated,
    transactionRisk,
    thresholdPrice,
  ]);

  /* =======================================================
     FUTURE CROP PREDICTION
  ======================================================= */

  const futureCropPrediction = useMemo(() => {
    const demandFactor =
      Number(requirement.quantity) >= 10000
        ? 25
        : 15;

    const predictions = [
      {
        crop: "Tomato",
        score: Math.min(
          100,
          55 + demandFactor + (marketUpdated ? 20 : 15)
        ),
        reason:
          "Buyer demand and seasonal market activity are strong.",
      },
      {
        crop: "Chilli",
        score: marketUpdated ? 78 : 70,
        reason:
          "Seasonal demand and market potential are favorable.",
      },
      {
        crop: "Paddy",
        score: 68,
        reason:
          "Demand is comparatively stable and market conditions are predictable.",
      },
    ];

    return predictions.sort((a, b) => b.score - a.score);
  }, [requirement.quantity, marketUpdated]);

  /* =======================================================
     SPLASH
  ======================================================= */

  if (page === "splash") {
    return (
      <main className="splash">
        <div className="logo">🌾🤖</div>

        <h1>{t.appName}</h1>

        <p>{t.tagline}</p>

        <Button onClick={() => navigate("language")}>
          {t.getStarted} →
        </Button>
      </main>
    );
  }

  /* =======================================================
     LANGUAGE
  ======================================================= */

  if (page === "language") {
    return (
      <Layout
        {...layoutProps}
        title={t.chooseLanguage}
        showNavigation={false}
      >
        <div className="grid two">
          {Object.keys(translations).map((lang) => (
            <Card
              key={lang}
              className={
                language === lang ? "selected" : ""
              }
            >
              <h2>{lang}</h2>

              <Button
                onClick={() => setLanguage(lang)}
              >
                {language === lang
                  ? "✓ Selected"
                  : "Select"}
              </Button>
            </Card>
          ))}
        </div>

        <br />

        <Button onClick={() => navigate("role")}>
          {t.continue} →
        </Button>
      </Layout>
    );
  }

  /* =======================================================
     ROLE
  ======================================================= */

  if (page === "role") {
    const roles = [
      ["Farmer", "👨‍🌾", t.farmer],
      ["Buyer", "🏢", t.buyer],
      ["FPO", "🏘️", t.fpo],
    ];

    return (
      <Layout
        {...layoutProps}
        title={t.chooseRole}
        showNavigation={false}
      >
        <div className="grid three">
          {roles.map(([value, icon, label]) => (
            <Card
              key={value}
              className={
                role === value ? "selected" : ""
              }
            >
              <h1>{icon}</h1>

              <h2>{label}</h2>

              <Button onClick={() => setRole(value)}>
                Select
              </Button>
            </Card>
          ))}
        </div>

        {role && (
          <Button onClick={() => navigate("login")}>
            {t.continue} →
          </Button>
        )}
      </Layout>
    );
  }

  /* =======================================================
     LOGIN
  ======================================================= */

  if (page === "login") {
    function sendDemoOtp() {
      const digits = contact.replace(/\D/g, "");
      if (!userName.trim()) {
        alert("Enter your full name first.");
        return;
      }
      if (!/^[6-9]\d{9}$/.test(digits)) {
        alert("Enter a valid 10-digit Indian mobile number.");
        return;
      }
      // Local demo only: no SMS is sent without an SMS gateway/backend.
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setDemoOtp(code);
      setOtp(code); // auto-fill for the no-provider hackathon demo
      setOtpSent(true);
      setOtpVerified(true);
      setContact(digits);
    }

    function enterApplication() {
      if (!userName.trim() || !contact.trim() || !otpVerified || otp !== demoOtp) {
        alert("Enter your name and mobile number, then verify the OTP.");
        return;
      }
      const now = new Date().toLocaleString();
      setLoginHistory((previous) => [{ name: userName, role, time: now }, ...previous]);
      localStorage.setItem("aiFarmingSession", JSON.stringify({ language, role, userName, contact }));
      setLoggedIn(true);
      setHistory([]);
      setPage(getDashboard());
    }

    return (
      <Layout {...layoutProps} title={t.login} showNavigation={false}>
        <Card className="form-card auth-card">
          <div className="auth-intro"><span className="auth-lock">🔐</span><h2>Secure mobile sign-in</h2><p>Enter your name and mobile number to continue as {role || "a user"}.</p></div>
          <Input label="Full name" autoComplete="name" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Enter your full name" />
          <Input label="Mobile number" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={contact} onChange={(e) => { const digits = e.target.value.replace(/\D/g, "").slice(0, 10); setContact(digits); setOtpSent(false); setOtpVerified(false); setOtp(""); setDemoOtp(""); if (digits.length === 10 && userName.trim() && /^[6-9]\d{9}$/.test(digits)) { const code = String(Math.floor(100000 + Math.random() * 900000)); setDemoOtp(code); setOtp(code); setOtpSent(true); setOtpVerified(true); } }} placeholder="10-digit mobile number" />
          <Button onClick={sendDemoOtp}>Send OTP / Auto-fill demo OTP</Button>
          {otpSent && <div className="otp-demo-panel"><strong>Demo OTP auto-filled: {demoOtp}</strong><p>This is a local prototype code only. No SMS was sent and this is not production authentication.</p><label>OTP</label><input aria-label="OTP" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpVerified(false); }} /><Button className="secondary" onClick={() => { if (otp === demoOtp && otp.length === 6) setOtpVerified(true); else { setOtpVerified(false); alert("OTP does not match the demo code."); } }}>Verify OTP</Button><span className="otp-verified">{otp === demoOtp && otpVerified ? "✓ Demo OTP verified" : "OTP needs verification"}</span></div>}
          <p className="auth-role-note">Selected role: <strong>{role}</strong></p>
          <Button disabled={!otpSent || !otpVerified || otp !== demoOtp} onClick={enterApplication}>{t.enterApplication} →</Button>
          <p className="prototype-notice">Production note: real SMS delivery and secure verification require an SMS provider plus a backend endpoint. A browser-only OTP must not be used to protect real accounts.</p>
        </Card>
      </Layout>
    );
  }

  /* =======================================================
     FARMER DASHBOARD
  ======================================================= */

  if (page === "farmer-dashboard") {
    const coreItems = [
      ["➕", "Add Crop Listing", "Capture crop evidence with live camera and mandatory GPS.", "crop-listing"],
      ["📦", "My Crop Lots", "Review, edit and manage available crop lots.", "my-crops"],
      ["🤝", "Buyer Requirements & Matches", "View buyer-posted crop demand and match it with your crop lots; no manual buyer-offer entry.", "buyer-offers"],
      ["🛒", "Selling Channels", "Review potential marketplace and local-buyer routes.", "market-intelligence"],
      ["🚚", "Orders & Tracking", "Track pickup, delivery and payment milestones.", "orders"],
      ["💰", "Net Return Intelligence", "Estimate profit after logistics and other costs.", "net-return"],
    ];
    const smartItems = [
      ["🌦️", "Weather & Crop Alerts", "weather-tools", "Weather", "Check entered conditions and field precautions."],
      ["🩺", "Crop Doctor", "crop-doctor", "Crop health", "Review symptoms, crop-care guidance and ask questions."],
      ["📍", "Mandi Price Comparison", "mandi-prices", "Selling", "Compare editable market rates after transport costs."],
      ["🧮", "Farm Profit Tracker", "profit-tracker", "Finance", "Calculate revenue, expenses and estimated profit."],
      ["💧", "Smart Water Advisor", "water-advisor", "Irrigation", "Get general guidance from soil condition and crop stage."],
      ["📜", "Government Schemes", "schemes", "Schemes", "Open official scheme portals and information."],
      ["🎙️", "Voice Crop Assistant", "voice-helper", "Voice", "Ask a crop question using supported browser speech."],
      ["📡", "Offline Notes", "offline-support", "Offline", "Keep field notes saved in this browser."],
    ];
    const operationsItems = [
      ["📈", "Future Crop Prediction", "future-prediction"],
      ["🏪", "Storage Feasibility", "storage-feasibility"],
      ["⚠️", "Transaction Risk", "risk-intelligence"],
      ["👥", "Customer History", "customer-history"],
      ["🚛", "Logistics & Tracking", "logistics"],
      ["💳", "Transactions", "payments"],
      ["📦", "Orders", "orders"],
      ["🧾", "Login History", "login-history"],
      ["👤", "Profile", "profile"],
    ];

    return (
      <Layout
        {...layoutProps}
        title={`👨‍🌾 ${t.farmer} ${t.dashboard}`}
        showNavigation={false}
      >
        <section className="farmer-welcome-panel">
          <div className="farmer-welcome-copy">
            <span className="dashboard-eyebrow">YOUR FARM • YOUR MARKET • YOUR DECISIONS</span>
            <h2>Good to see you, {userName || "Farmer"} 🌱</h2>
            <p>Manage crop listings, understand your farm economics, and make more informed selling decisions from one place.</p>
            <div className="farmer-hero-actions">
              <Button onClick={() => navigate("crop-listing")}>＋ Add a crop</Button>
              <Button className="secondary" onClick={() => navigate("crop-doctor")}>🩺 Open Crop Doctor</Button>
            </div>
          </div>
          <div className="farmer-hero-stat">
            <span className="hero-stat-icon">🌾</span>
            <span className="hero-stat-label">Your crop workspace</span>
            <strong>{myLots.length}</strong>
            <span className="hero-stat-caption">crop lots linked to this session</span>
          </div>
        </section>

        <Card className="location-map-card farmer-location-card">
          <h2>📍 Your farm device location</h2>
          <p>{gpsCoordinates ? `GPS updated automatically · ±${gpsCoordinates.accuracy} m accuracy` : `${gpsStatus}. Allow location access to display the map.`}</p>
          {gpsCoordinates && <><iframe title="Farmer current location map" className="location-map-frame" loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${gpsCoordinates.longitude - 0.01}%2C${gpsCoordinates.latitude - 0.01}%2C${gpsCoordinates.longitude + 0.01}%2C${gpsCoordinates.latitude + 0.01}&layer=mapnik&marker=${gpsCoordinates.latitude}%2C${gpsCoordinates.longitude}`} /><a href={`https://www.openstreetmap.org/?mlat=${gpsCoordinates.latitude}&mlon=${gpsCoordinates.longitude}#map=15/${gpsCoordinates.latitude}/${gpsCoordinates.longitude}`} target="_blank" rel="noreferrer">Open full map ↗</a></>}
        </Card>
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div><span className="dashboard-eyebrow">01 • SELLING OPERATIONS</span><h2>Orders & Selling</h2></div>
            <p>Quick access to your most-used tasks.</p>
          </div>
          <div className="grid three farmer-core-grid">
            {coreItems.map(([icon, label, description, target]) => (
              <Card key={target} className="farmer-action-card">
                <span className="farmer-card-icon">{icon}</span>
                <h3>{label}</h3>
                <p>{description}</p>
                <Button onClick={() => navigate(target)}>Open workspace →</Button>
              </Card>
            ))}
          </div>
        </section>

        <section className="dashboard-section farmer-smart-section">
          <div className="dashboard-section-heading">
            <div><span className="dashboard-eyebrow">02 • FARM INTELLIGENCE</span><h2>Crop Care & Future Planning</h2></div>
            <p>Crop Doctor, future crop analysis, storage feasibility, weather, water and mandi intelligence.</p>
          </div>
          <div className="grid three farmer-smart-grid">
            {smartItems.map(([icon, label, target, tag, description]) => (
              <button type="button" key={target} className="farmer-smart-tile" onClick={() => navigate(target)}>
                <span className="farmer-tile-top"><span className="farmer-card-icon">{icon}</span><span className="farmer-tile-tag">{tag}</span></span>
                <strong>{label}</strong>
                <span className="farmer-tile-description">{description}</span>
                <span className="farmer-tile-link">Explore tool <span aria-hidden="true">↗</span></span>
              </button>
            ))}
          </div>
          <p className="dashboard-data-note">Prototype notice: market prices and weather are manually entered examples; crop guidance is preliminary and not a confirmed diagnosis. Verify time-sensitive information before acting.</p>
        </section>

        <section className="dashboard-section">
          <div className="grid two">
            <Card className="location-map-card">
              <h3>📍 Your automatic location</h3>
              <p>{gpsCoordinates ? `GPS ready · ±${gpsCoordinates.accuracy} m accuracy` : gpsStatus}</p>
              {gpsCoordinates ? <><p>{gpsCoordinates.latitude}, {gpsCoordinates.longitude}</p><iframe title="Farmer current location map" className="location-map-frame" loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${gpsCoordinates.longitude - 0.01}%2C${gpsCoordinates.latitude - 0.01}%2C${gpsCoordinates.longitude + 0.01}%2C${gpsCoordinates.latitude + 0.01}&layer=mapnik&marker=${gpsCoordinates.latitude}%2C${gpsCoordinates.longitude}`} /><a href={`https://www.openstreetmap.org/?mlat=${gpsCoordinates.latitude}&mlon=${gpsCoordinates.longitude}#map=15/${gpsCoordinates.latitude}/${gpsCoordinates.longitude}`} target="_blank" rel="noreferrer">Open full map ↗</a></> : <p>Allow location permission to show your map automatically.</p>}
            </Card>
            <Card className="cod-settings-card">
              <h3>💵 Cash on Delivery preference</h3>
              <p>Choose whether buyers can place COD orders for your crop lots.</p>
              <Button className={codEnabled ? "" : "secondary"} onClick={() => setCodEnabled((value) => !value)}>{codEnabled ? "✓ COD enabled — click to disable" : "COD disabled — click to enable"}</Button>
              <Button className="secondary" onClick={() => navigate("notifications")}>🔔 Notifications & risk alerts</Button>
            </Card>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div><span className="dashboard-eyebrow">MANAGE & TRACK</span><h2>Operations and account</h2></div>
          </div>
          <div className="grid three farmer-operations-grid">
            {operationsItems.map(([icon, label, target]) => (
              <button type="button" key={target} className="farmer-operation-tile" onClick={() => navigate(target)}>
                <span>{icon}</span><strong>{label}</strong><span className="operation-arrow">→</span>
              </button>
            ))}
          </div>
        </section>
      </Layout>
    );
  }

  /* =======================================================
     FARMER SMART CENTER: weather, crop doctor, mandi, profit,
     water, schemes and voice tools. Prototype data is labelled.
  ======================================================= */

  if (page === "weather-tools") {
    const temperature = Number(farmTemperature);
    const rain = Number(farmRainChance);
    const humidity = Number(farmHumidity);
    const weatherAdvice = rain >= 70
      ? "Rain chance is high based on the values entered. Check the local forecast before spraying; postpone spraying during rain or strong wind and ensure field drainage."
      : temperature >= 35
        ? "High temperature entered. Check soil moisture early in the morning, avoid irrigation during peak heat where practical, and watch for heat stress."
        : humidity >= 85
          ? "High humidity entered. Inspect crops for fungal symptoms and avoid unnecessary leaf wetness. Use local extension guidance before applying any treatment."
          : "Continue regular field scouting and check an official local forecast before irrigation, spraying or harvesting.";

    return (
      <Layout {...layoutProps} title="🌦️ Weather & Crop Alerts">
        <Card>
          <p className="prototype-notice">Prototype mode: these values are entered manually, not fetched from a live weather service.</p>
          <div className="grid two">
            <Input label="Village / farm location" value={farmLocation} onChange={(e) => setFarmLocation(e.target.value)} placeholder="e.g. Nellore" />
            <Input label="Temperature (°C)" type="number" value={farmTemperature} onChange={(e) => setFarmTemperature(e.target.value)} />
            <Input label="Rain chance (%)" type="number" min="0" max="100" value={farmRainChance} onChange={(e) => setFarmRainChance(e.target.value)} />
            <Input label="Humidity (%)" type="number" min="0" max="100" value={farmHumidity} onChange={(e) => setFarmHumidity(e.target.value)} />
          </div>
          <div className="smart-result"><h3>🌱 Suggested field action</h3><p>{weatherAdvice}</p></div>
          <p>Before acting, confirm current conditions with an official forecast or local agricultural extension service.</p>
        </Card>
      </Layout>
    );
  }

  if (page === "crop-doctor") {
    function analyzeCropSymptoms() {
      const symptom = doctorSymptoms.toLowerCase();
      let result;
      if (symptom.includes("hole") || symptom.includes("chew") || symptom.includes("insect")) {
        result = { title: "Possible insect damage", signs: "Look under leaves and around new shoots for insects, eggs or fresh feeding marks.", fertilizer: "Do not add extra fertilizer unless a soil or crop assessment shows a need; excess nitrogen can worsen some pest problems.", pesticide: "Use integrated pest management first: remove heavily affected plant parts where practical and identify the pest. If needed, use only a locally registered product labelled for this crop and pest, at the label rate." };
      } else if (symptom.includes("spot") || symptom.includes("mould") || symptom.includes("mold") || symptom.includes("rot")) {
        result = { title: "Possible fungal or bacterial leaf/fruit disease", signs: "Spots and rot can have multiple causes. Check whether lesions spread, have a halo, or appear after prolonged leaf wetness.", fertilizer: "Maintain balanced nutrition; fertilizer alone will not cure an infectious disease. Avoid applying nutrients without confirming a deficiency.", pesticide: "Improve airflow, avoid overhead watering when possible, remove infected debris safely, and ask a local extension officer to confirm the cause before choosing a registered fungicide or bactericide." };
      } else if (symptom.includes("yellow") || symptom.includes("pale")) {
        result = { title: "Possible nutrient, water or root stress", signs: "Yellowing may result from nitrogen deficiency, waterlogging, drought, root damage or disease. Check which leaves are affected and inspect soil moisture and roots.", fertilizer: "Do not apply a fertilizer dose based on leaf colour alone. Use a soil test or local crop nutrient recommendation; nitrogen may help only if deficiency is confirmed.", pesticide: "A pesticide is not indicated from yellowing alone. Check for insects and disease signs first, and avoid spraying without a confirmed target." };
      } else if (symptom.includes("wilt") || symptom.includes("dry") || symptom.includes("curl")) {
        result = { title: "Possible water stress, heat stress or root disease", signs: "Check soil moisture early in the day, drainage, root condition and whether neighbouring plants show the same symptoms.", fertilizer: "Avoid fertilizing a severely stressed plant until water or root problems are assessed.", pesticide: "Do not use pesticide without identifying a pest or pathogen. If wilting persists despite suitable soil moisture, seek local diagnosis." };
      } else {
        result = { title: "More information needed", signs: "The selected symptom is not enough to identify a cause reliably. Note affected plant parts, crop age, spread pattern and recent weather.", fertilizer: "Use soil-test-based, crop-stage-specific nutrition advice; avoid blind fertilizer mixing.", pesticide: "Do not spray a pesticide until the pest or disease is identified and a locally registered product is selected according to its label." };
      }
      setDoctorAnalysis(result);
    }

    function answerCropQuestion() {
      const q = doctorQuestion.toLowerCase();
      let answer = "I can help with general crop care. Please mention the crop, growth stage, location, visible symptoms and how long the problem has been present. For a reliable recommendation, confirm locally with a Krishi Vigyan Kendra or agriculture officer.";
      if (q.includes("water") || q.includes("irrigat")) answer = `For ${doctorCrop}, check soil moisture and crop stage before irrigating. Avoid both prolonged waterlogging and severe drying. Exact irrigation needs depend on soil, weather and crop stage.`;
      else if (q.includes("fertilizer") || q.includes("fertiliser") || q.includes("nutrient")) answer = `For ${doctorCrop}, use a soil-test-based nutrient plan and follow the crop-specific recommendation for your region and growth stage. Avoid guessing a dose or mixing products without label guidance.`;
      else if (q.includes("pest") || q.includes("insect") || q.includes("pesticide")) answer = `For ${doctorCrop}, first identify the pest and check whether damage is increasing. Prefer integrated pest management. Use only a product registered for the crop and target pest, exactly as its label directs; follow protective-equipment and pre-harvest interval instructions.`;
      else if (q.includes("yellow") || q.includes("leaf") || q.includes("disease") || q.includes("spot")) answer = `Symptoms on ${doctorCrop} can have several causes. Compare affected and healthy plants, inspect both sides of leaves, check soil moisture and note recent weather. A photo alone is not enough for a certain diagnosis in this prototype; seek local confirmation before treatment.`;
      else if (q.includes("price") || q.includes("market") || q.includes("sell")) answer = "Compare today's verified prices from nearby regulated markets, then subtract transport, handling and commission costs before choosing where to sell. The sample rates in this prototype are not live market prices.";
      setDoctorAnswer(answer);
    }

    return (
      <Layout {...layoutProps} title="🩺 Crop Doctor & Crop Question Assistant">
        <Card>
          <p className="prototype-notice">Important: this version provides symptom-based guidance and crop Q&A. It does not run an image-recognition model yet, so the uploaded photo is shown for reference and is not automatically diagnosed.</p>
          <div className="grid two">
            <Select label="Crop" value={doctorCrop} onChange={(e) => setDoctorCrop(e.target.value)}>
              <option>Tomato</option><option>Rice</option><option>Chilli</option><option>Cotton</option><option>Maize</option><option>Groundnut</option><option>Onion</option><option>Mango</option><option>Other crop</option>
            </Select>
            <Select label="Main symptom" value={doctorSymptoms} onChange={(e) => setDoctorSymptoms(e.target.value)}>
              <option>Yellow leaves</option><option>Leaf spots or mould</option><option>Holes or insect damage</option><option>Wilting or curling</option><option>Fruit or stem rot</option><option>Other / not sure</option>
            </Select>
          </div>
          <Input label="Upload crop photo (preview only in this version)" type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setDoctorImage(String(reader.result || "")); reader.readAsDataURL(file); }} />
          {doctorImage && <img className="crop-doctor-image" src={doctorImage} alt="Uploaded crop for reference" />}
          <Button onClick={analyzeCropSymptoms}>Get Initial Guidance</Button>
          {doctorAnalysis && <div className="smart-result"><h3>{doctorAnalysis.title}</h3><p><strong>What to inspect:</strong> {doctorAnalysis.signs}</p><p><strong>Fertilizer guidance:</strong> {doctorAnalysis.fertilizer}</p><p><strong>Pest / pesticide guidance:</strong> {doctorAnalysis.pesticide}</p><AIVoiceExplanation language={language} text={`${doctorAnalysis.title}. ${doctorAnalysis.signs} Fertilizer guidance: ${doctorAnalysis.fertilizer} Pesticide guidance: ${doctorAnalysis.pesticide}`} /></div>}
        </Card>
        <Card>
          <h2>💬 Ask any crop question</h2>
          <Input label="Your question" value={doctorQuestion} onChange={(e) => setDoctorQuestion(e.target.value)} placeholder="e.g. Why are my tomato leaves turning yellow?" />
          <VoiceInput language={language} buttonText="Ask by voice" onResult={setDoctorQuestion} />
          <Button onClick={answerCropQuestion} disabled={!doctorQuestion.trim()}>Get Answer</Button>
          {doctorAnswer && <div className="smart-result"><p>{doctorAnswer}</p><AIVoiceExplanation language={language} text={doctorAnswer} /></div>}
        </Card>
      </Layout>
    );
  }

  if (page === "mandi-prices") {
    const local = Number(mandiRates.local || 0);
    const nearby = Number(mandiRates.nearby || 0);
    const distant = Number(mandiRates.distant || 0);
    const transport = Number(mandiRates.transport || 0);
    const options = [{ name: "Local market", price: local, net: local }, { name: "Nearby market", price: nearby, net: nearby - transport }, { name: "Distant market", price: distant, net: distant - transport * 1.7 }].sort((a,b) => b.net - a.net);
    return <Layout {...layoutProps} title="📍 Mandi Price Comparison"><Card><p className="prototype-notice">Sample / editable prices only. No live mandi feed is connected. Replace these with verified prices before making a selling decision.</p><Select label="Crop" value={mandiCrop} onChange={(e) => setMandiCrop(e.target.value)}><option>Tomato</option><option>Rice</option><option>Chilli</option><option>Cotton</option><option>Maize</option><option>Groundnut</option><option>Onion</option></Select><div className="grid two"><Input label="Local market ₹/kg" type="number" value={mandiRates.local} onChange={(e) => setMandiRates(p => ({...p, local:e.target.value}))} /><Input label="Nearby market ₹/kg" type="number" value={mandiRates.nearby} onChange={(e) => setMandiRates(p => ({...p, nearby:e.target.value}))} /><Input label="Distant market ₹/kg" type="number" value={mandiRates.distant} onChange={(e) => setMandiRates(p => ({...p, distant:e.target.value}))} /><Input label="Transport cost per kg (₹)" type="number" value={mandiRates.transport} onChange={(e) => setMandiRates(p => ({...p, transport:e.target.value}))} /></div><div className="grid three">{options.map(o => <Card key={o.name}><h3>{o.name}</h3><p>Gross price: ₹{o.price.toFixed(2)}/kg</p><h2>Net estimate: ₹{o.net.toFixed(2)}/kg</h2></Card>)}</div><div className="smart-result"><strong>Best estimated net return:</strong> {options[0].name} for {mandiCrop}, using only the editable values above. Verify price freshness, quality deductions, commissions and transport charges.</div></Card></Layout>;
  }

  if (page === "profit-tracker") {
    const totalCost = Object.entries(farmExpenses).filter(([key]) => !["quantity", "salePrice"].includes(key)).reduce((sum, [, value]) => sum + Number(value || 0), 0);
    const revenue = Number(farmExpenses.quantity || 0) * Number(farmExpenses.salePrice || 0);
    const profit = revenue - totalCost;
    const fields = [["seeds","Seeds (₹)"],["fertilizer","Fertilizer (₹)"],["labour","Labour (₹)"],["water","Water / electricity (₹)"],["transport","Transport / handling (₹)"],["other","Other costs (₹)"],["quantity","Quantity sold (kg)"],["salePrice","Selling price (₹/kg)"]];
    return <Layout {...layoutProps} title="🧮 Farm Profit & Expense Tracker"><Card><p>Enter your own values to calculate gross revenue, cultivation costs and estimated net profit.</p><div className="grid two">{fields.map(([key,label]) => <Input key={key} label={label} type="number" min="0" value={farmExpenses[key]} onChange={(e) => setFarmExpenses(p => ({...p,[key]:e.target.value}))} />)}</div><div className="grid three"><Card><p>Total costs</p><h2>₹{totalCost.toLocaleString("en-IN")}</h2></Card><Card><p>Gross revenue</p><h2>₹{revenue.toLocaleString("en-IN")}</h2></Card><Card><p>Estimated net profit</p><h2 className={profit >= 0 ? "profit-positive" : "profit-negative"}>₹{profit.toLocaleString("en-IN")}</h2></Card></div><p className="prototype-notice">This is a calculation from your entries, not an audited account. Include land rent, loan interest, family labour and spoilage if they apply.</p></Card></Layout>;
  }

  if (page === "water-advisor") {
    const advice = waterSoil === "Dry" ? "Soil is marked dry: check root-zone moisture and irrigate if the crop-stage recommendation indicates a need. Prefer early morning or evening where suitable; avoid runoff." : waterSoil === "Waterlogged" ? "Waterlogging selected: avoid adding irrigation, improve drainage where safe, and inspect roots for damage. Some crops are highly sensitive to standing water." : waterStage === "Flowering" ? "Flowering stage selected: avoid moisture stress and large moisture swings. Check the root zone and local crop-specific irrigation schedule." : "Soil is marked moist: recheck the root zone before irrigating. Use crop stage, soil type, rainfall and local extension recommendations to decide timing.";
    return <Layout {...layoutProps} title="💧 Smart Water & Irrigation Advisor"><Card><p className="prototype-notice">General guidance only. This is not connected to soil sensors or live weather.</p><Select label="Crop" value={waterCrop} onChange={(e) => setWaterCrop(e.target.value)}><option>Rice</option><option>Tomato</option><option>Chilli</option><option>Cotton</option><option>Maize</option><option>Groundnut</option><option>Other crop</option></Select><Select label="Observed soil condition" value={waterSoil} onChange={(e) => setWaterSoil(e.target.value)}><option>Moist</option><option>Dry</option><option>Waterlogged</option></Select><Select label="Crop growth stage" value={waterStage} onChange={(e) => setWaterStage(e.target.value)}><option>Seedling</option><option>Vegetative</option><option>Flowering</option><option>Fruit / grain filling</option><option>Near harvest</option></Select><div className="smart-result"><h3>Recommendation for {waterCrop}</h3><p>{advice}</p><p>Actual irrigation intervals depend on soil texture, rooting depth, crop variety, rainfall and local recommendations.</p></div><AIVoiceExplanation language={language} text={`Water advice for ${waterCrop}. ${advice}`} /></Card></Layout>;
  }

  if (page === "schemes") {
    return <Layout {...layoutProps} title="📜 Government Schemes & Subsidies"><div className="grid two"><Card><h3>PM-KISAN</h3><p>Income-support scheme for eligible farmer families, subject to current eligibility and verification rules.</p><a href="https://pmkisan.gov.in/" target="_blank" rel="noreferrer">Official PM-KISAN portal ↗</a></Card><Card><h3>PMFBY Crop Insurance</h3><p>Crop insurance information, enrolment windows and notified crops vary by season and state.</p><a href="https://pmfby.gov.in/" target="_blank" rel="noreferrer">Official PMFBY portal ↗</a></Card><Card><h3>Kisan Credit Card (KCC)</h3><p>Ask your bank or cooperative about current eligibility, credit limits, interest support and required documents.</p><a href="https://www.myscheme.gov.in/" target="_blank" rel="noreferrer">Find schemes on MyScheme ↗</a></Card><Card><h3>State agriculture support</h3><p>State-specific subsidies, input support and application dates change. Confirm current details with your district agriculture office or official state portal.</p><a href="https://apagriculture.ap.gov.in/" target="_blank" rel="noreferrer">Andhra Pradesh Agriculture ↗</a></Card></div><p className="prototype-notice">These are starting points, not an eligibility decision. Never pay an agent based only on an app message; verify applications and deadlines through official channels.</p></Layout>;
  }

  if (page === "voice-helper") {
    return <Layout {...layoutProps} title="🎙️ Voice Crop Assistant"><Card><h2>Ask using your voice</h2><p>Use speech input in the selected app language, then send the question to the local crop Q&A helper.</p><Input label="Crop" value={doctorCrop} onChange={(e) => setDoctorCrop(e.target.value)} /><Input label="Your crop question" value={doctorQuestion} onChange={(e) => setDoctorQuestion(e.target.value)} placeholder="Ask about pests, water, fertilizer or symptoms" /><VoiceInput language={language} buttonText="Speak your question" onResult={setDoctorQuestion} /><Button disabled={!doctorQuestion.trim()} onClick={() => { const q = doctorQuestion.toLowerCase(); const answer = q.includes("water") ? `For ${doctorCrop}, check soil moisture and crop stage before irrigating; avoid waterlogging and severe drying.` : q.includes("fertilizer") || q.includes("fertiliser") ? `For ${doctorCrop}, follow a soil-test-based nutrient plan and local crop-stage recommendations. Avoid guessing doses.` : q.includes("pest") || q.includes("pesticide") ? `For ${doctorCrop}, identify the pest first and use only a locally registered product according to its label. Seek local extension advice if uncertain.` : `For ${doctorCrop}, please check crop symptoms, soil moisture and recent weather. For specific diagnosis or treatment, confirm with a local agriculture officer. This offline helper provides general guidance only.`; setDoctorAnswer(answer); }}>Answer Question</Button>{doctorAnswer && <div className="smart-result"><p>{doctorAnswer}</p><AIVoiceExplanation language={language} text={doctorAnswer} /></div>}<p className="prototype-notice">Voice recognition and spoken answers depend on browser/device support. The Q&A is a local rule-based prototype, not a connected generative AI model.</p><Button className="secondary" onClick={() => navigate("crop-doctor")}>Open Crop Doctor & Photo Preview</Button></Card></Layout>;
  }

  /* =======================================================
     CROP LISTING / EDIT
  ======================================================= */

  if (page === "crop-listing") {
    async function captureGps() {
      if (!navigator.geolocation) {
        setGpsStatus("GPS is not supported by this browser");
        alert("GPS is not supported. Use a supported mobile browser or device.");
        return null;
      }
      setGpsStatus("Getting GPS location…");
      return new Promise((resolve) => navigator.geolocation.getCurrentPosition((position) => {
        const coords = { latitude: Number(position.coords.latitude.toFixed(6)), longitude: Number(position.coords.longitude.toFixed(6)), accuracy: Math.round(position.coords.accuracy) };
        const capturedAt = new Date().toISOString();
        setGpsCoordinates(coords);
        setGpsStatus(`GPS captured ±${coords.accuracy} m`);
        setCropForm((previous) => ({ ...previous, location: `GPS ${coords.latitude}, ${coords.longitude}`, gpsCoordinates: coords, gpsCapturedAt: capturedAt }));
        resolve(coords);
      }, (error) => {
        const message = error.code === 1 ? "Location permission denied" : "Unable to get GPS location";
        setGpsStatus(message);
        alert(`${message}. GPS is mandatory to list a crop.`);
        resolve(null);
      }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }));
    }

    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera requires HTTPS or localhost and a supported browser.");
        const coords = await captureGps();
        if (!coords) return;
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        streamRef.current = stream;
        setCameraOpen(true);
        setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
      } catch (error) {
        alert(error?.message || "Camera/microphone permission was not available.");
      }
    }

    function stopCamera() {
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraOpen(false);
      setIsRecording(false);
    }

    async function capturePhoto() {
      if (!videoRef.current || !gpsCoordinates) {
        alert("Capture GPS first and keep the live camera open.");
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const image = canvas.toDataURL("image/jpeg", 0.82);
      setCropForm((previous) => ({ ...previous, image, videoEvidence: "", gpsCoordinates, gpsCapturedAt: new Date().toISOString() }));
      stopCamera();
    }

    function startVideoRecording() {
      if (!streamRef.current || !gpsCoordinates || !window.MediaRecorder) {
        alert("Open camera and capture GPS first. Video recording may not be supported by this browser.");
        return;
      }
      videoChunksRef.current = [];
      const recorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data?.size) videoChunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: recorder.mimeType || "video/webm" });
        const reader = new FileReader();
        reader.onloadend = () => setCropForm((previous) => ({ ...previous, videoEvidence: reader.result, image: "", gpsCoordinates, gpsCapturedAt: new Date().toISOString() }));
        reader.readAsDataURL(blob);
        setIsRecording(false);
      };
      recorder.start();
      setIsRecording(true);
      // Keep the evidence clip short for browser storage and demo reliability.
      setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, 10000);
    }

    function stopVideoRecording() {
      if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    }

    function analyzeQuality() {
      if (!cropForm.image && !cropForm.videoEvidence) {
        alert("Capture a live crop photo or record a short live video first.");
        return;
      }
      if (!cropForm.gpsCoordinates) {
        alert("GPS evidence is mandatory. Capture location using the live camera button.");
        return;
      }

      const grade =
        cropForm.quality === "A Grade"
          ? "A Grade"
          : cropForm.quality;

      setCropForm((previous) => ({
        ...previous,
        aiGrade: grade,
      }));
    }

    function saveCrop() {
      if (
        !cropForm.crop.trim() ||
        !cropForm.quantity ||
        !cropForm.location.trim() ||
        !cropForm.price ||
        (!cropForm.image && !cropForm.videoEvidence) ||
        !cropForm.gpsCoordinates
      ) {
        alert("Complete crop details, enter the expected price, capture live photo/video evidence, and capture GPS before listing.");
        return;
      }

      if (editingLotId) {
        setLots((previous) =>
          previous.map((lot) =>
            lot.id === editingLotId
              ? {
                  ...lot,
                  crop: cropForm.crop,
                  quantity: Number(cropForm.quantity),
                  location: cropForm.location,
                  harvest: cropForm.harvest,
                  quality: cropForm.quality,
                  price: Number(cropForm.price),
                  image: cropForm.image,
                  videoEvidence: cropForm.videoEvidence,
                  gpsCoordinates: cropForm.gpsCoordinates,
                  gpsCapturedAt: cropForm.gpsCapturedAt,
                  aiGrade:
                    cropForm.aiGrade ||
                    cropForm.quality,
                }
              : lot
          )
        );

        setEditingLotId(null);

        alert("Crop information updated successfully.");
      } else {
        const newLot = {
          id: Date.now(),
          crop: cropForm.crop,
          quantity: Number(cropForm.quantity),
          location: cropForm.location,
          harvest: cropForm.harvest,
          quality: cropForm.quality,
          aiGrade:
            cropForm.aiGrade ||
            cropForm.quality,
          price: Number(cropForm.price),
          farmer: userName,
          phone: contact,
          ownerId: contact,
          image: cropForm.image,
          videoEvidence: cropForm.videoEvidence,
          gpsCoordinates: cropForm.gpsCoordinates,
          gpsCapturedAt: cropForm.gpsCapturedAt,
          channelSuggestions: ["Local buyers", "FPO / Cooperative", "Retail marketplace readiness"],
          status: "Available",
        };

        setLots((previous) => [
          ...previous,
          newLot,
        ]);

        setSelectedLot(newLot);

        alert("Crop listed successfully.");
      }

      setCropForm({
        crop: "",
        quantity: "",
        location: "",
        harvest: "",
        quality: "A Grade",
        price: "",
        image: "",
        videoEvidence: "",
        gpsCoordinates: null,
        gpsCapturedAt: "",
        aiGrade: "",
      });
      setGpsCoordinates(null);
      setGpsStatus("Location not captured");
      setVideoEvidence("");
      navigate("my-crops");
    }

    return (
      <Layout
        {...layoutProps}
        title="🌱 Smart Crop Listing"
      >
        <Card className="form-card">
          <Input
            label={t.cropName}
            value={cropForm.crop}
            onChange={(e) =>
              setCropForm((previous) => ({
                ...previous,
                crop: e.target.value,
              }))
            }
          />

          <VoiceInput
            language={language}
            buttonText={t.voiceInput}
            onResult={(text) =>
              setCropForm((previous) => ({
                ...previous,
                crop: text,
              }))
            }
          />

          <Input
            label={t.quantity}
            type="number"
            value={cropForm.quantity}
            onChange={(e) =>
              setCropForm((previous) => ({
                ...previous,
                quantity: e.target.value,
              }))
            }
          />

          <Input label="Automatic GPS location" value={cropForm.location} readOnly placeholder="Allow location access to update automatically" />
          <p className="prototype-notice">Location updates from your device GPS when this form opens. You can refresh it by reopening the live camera. Browser permission is required.</p>

          <Input
            label={t.harvestDate}
            type="date"
            value={cropForm.harvest}
            onChange={(e) =>
              setCropForm((previous) => ({
                ...previous,
                harvest: e.target.value,
              }))
            }
          />

          <Select
            label={t.quality}
            value={cropForm.quality}
            onChange={(e) =>
              setCropForm((previous) => ({
                ...previous,
                quality: e.target.value,
              }))
            }
          >
            <option>A Grade</option>
            <option>B Grade</option>
            <option>Mixed Grade</option>
          </Select>

          <Input
            label={t.expectedPrice}
            type="number"
            value={cropForm.price}
            onChange={(e) =>
              setCropForm((previous) => ({
                ...previous,
                price: e.target.value,
              }))
            }
          />

          <section className="channel-suggestions">
            <h3>🛒 Suggested selling routes {cropForm.crop ? `for ${cropForm.crop}` : "for your crop"}</h3>
            <div className="grid three">
              <div className="channel-suggestion"><strong>Local buyers / retailers</strong><p>Best for nearby orders, quick pickup and lower transport cost.</p><span>Direct negotiation</span></div>
              <div className="channel-suggestion"><strong>FPO / Cooperative</strong><p>Useful when your quantity is small or buyers need aggregated supply.</p><span>Aggregation match</span></div>
              <div className="channel-suggestion"><strong>Quick-commerce / online retail</strong><p>{/tomato|mango|onion|potato|chilli|rice|vegetable|fruit/i.test(cropForm.crop) ? "Fresh produce may fit retailer demand, subject to grade, shelf-life, volume and cold-chain checks." : "Eligibility depends on category rules, packaging, quality standards and seller onboarding."}</p><span>Not connected — onboarding required</span></div>
            </div>
            <p className="prototype-notice">Blinkit, Flipkart and other marketplaces are not connected to this demo. This is a channel-fit suggestion, not a live listing or confirmed buyer order.</p>
          </section>

          <div className="quality-guidance live-evidence-card">
            <strong>📍 Mandatory live crop evidence</strong>
            <p>Gallery uploads are disabled. Capture a live photo or a video (up to 10 seconds) from your device camera. GPS must be captured at listing time.</p>
            <div className={`gps-status ${gpsCoordinates ? "gps-ready" : "gps-pending"}`}>● {gpsStatus}</div>
            {gpsCoordinates && <p className="gps-coordinates">Latitude: {gpsCoordinates.latitude} · Longitude: {gpsCoordinates.longitude} · Accuracy: ±{gpsCoordinates.accuracy} m</p>}
            <Button className="secondary" onClick={startCamera}>📷 Open Live Camera + Capture GPS</Button>
          </div>

          {cameraOpen && <div className="camera-container live-capture-panel">
            <video ref={videoRef} autoPlay playsInline muted />
            <div className="camera-actions">
              <Button onClick={capturePhoto}>📸 Capture live photo</Button>
              {!isRecording ? <Button className="secondary" onClick={startVideoRecording}>🎥 Record 10-second video</Button> : <Button className="danger" onClick={stopVideoRecording}>Stop recording</Button>}
              <Button className="danger" onClick={stopCamera}>Close camera</Button>
            </div>
            {isRecording && <p className="recording-indicator">● Recording live evidence…</p>}
          </div>}

          {cropForm.image && <div className="evidence-preview"><img src={cropForm.image} alt="Live captured crop evidence" className="image-preview" /><p>✓ Live photo captured with GPS evidence</p></div>}
          {cropForm.videoEvidence && <div className="evidence-preview"><video className="image-preview" src={cropForm.videoEvidence} controls /><p>✓ Live video captured with GPS evidence</p></div>}

          <Button
            className="secondary"
            onClick={analyzeQuality}
          >
            🤖 Analyze Crop Quality
          </Button>

          {cropForm.aiGrade && (
            <div className="quality-result">
              <h3>
                AI Quality Result:{" "}
                {cropForm.aiGrade}
              </h3>

              <p>Prototype grade preview only; no computer-vision model is connected yet. The captured evidence and GPS are stored with this crop lot.</p>
            </div>
          )}

          <Button onClick={saveCrop}>
            {editingLotId
              ? `${t.update} Crop`
              : `${t.save} Crop`}
          </Button>
        </Card>
      </Layout>
    );
  }

  /* =======================================================
     MY CROPS
  ======================================================= */

  if (page === "my-crops") {
    return (
      <Layout {...layoutProps} title="📦 My Crop Lots">
        {myLots.length === 0 ? (
          <Card>
            <h3>No crops listed yet.</h3>

            <Button
              onClick={() =>
                navigate("crop-listing")
              }
            >
              Add Crop
            </Button>
          </Card>
        ) : (
          <div className="grid">
            {myLots.map((lot) => (
              <Card key={lot.id}>
                <h2>🌱 {lot.crop}</h2>

                {lot.image && <img src={lot.image} alt={`${lot.crop} live evidence`} className="crop-image-preview" />}
                {lot.videoEvidence && <video src={lot.videoEvidence} controls className="crop-image-preview" />}
                {lot.gpsCoordinates && <p>📍 GPS evidence: {lot.gpsCoordinates.latitude}, {lot.gpsCoordinates.longitude} (±{lot.gpsCoordinates.accuracy} m)</p>}

                <p>Quantity: {lot.quantity} kg</p>
                <p>Location: {lot.location}</p>
                <p>Quality: {lot.quality}</p>
                <p>
                  AI Grade:{" "}
                  {lot.aiGrade || lot.quality}
                </p>
                <p>Price: ₹{lot.price}/kg</p>

                <Button
                  onClick={() => {
                    setSelectedLot(lot);
                    navigate("net-return");
                  }}
                >
                  Analyze
                </Button>

                <Button
                  className="secondary"
                  onClick={() => {
                    setEditingLotId(lot.id);

                    setCropForm({
                      crop: lot.crop,
                      quantity: lot.quantity,
                      location: lot.location,
                      harvest: lot.harvest,
                      quality: lot.quality,
                      price: lot.price,
                      image: lot.image || "",
                      videoEvidence: lot.videoEvidence || "",
                      gpsCoordinates: lot.gpsCoordinates || null,
                      gpsCapturedAt: lot.gpsCapturedAt || "",
                      aiGrade: lot.aiGrade || "",
                    });
                    setGpsCoordinates(lot.gpsCoordinates || null);
                    setGpsStatus(lot.gpsCoordinates ? "GPS captured for existing lot; recapture before updating" : "GPS not captured — required before updating");

                    navigate("crop-listing");
                  }}
                >
                  ✏️ {t.edit}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </Layout>
    );
  }

  /* =======================================================
     NET RETURN
  ======================================================= */

  if (page === "net-return") {
    return (
      <Layout
        {...layoutProps}
        title="💰 Net Return Intelligence"
      >
        <Card>
          {!farmerActiveLot ? (
            <p>Select a crop first.</p>
          ) : (
            <>
              <h2>{farmerActiveLot.crop}</h2>

              <p>
                Gross Selling Value: ₹{sellingValue}
              </p>

              <p>
                Delivery mode: <strong>{deliveryMode}</strong>
              </p>
              <p>
                Transport charge paid separately by buyer: ₹
                {buyerTransportCharge.toLocaleString("en-IN")}
              </p>

              <p>
                Storage Cost: ₹{storageCost}
              </p>

              <p>
                Handling Cost: ₹{handlingCost}
              </p>

              <hr />

              <h2>
                Estimated Net Return: ₹
                {estimatedNetReturn}
              </h2>

              <div className="success-box">
                Farmer net return excludes buyer-paid transport. Storage and handling are estimated farmer-side costs; confirm actual charges before accepting an order.
              </div>

              <AIVoiceExplanation
                language={language}
                text={`Estimated farmer net return is ${estimatedNetReturn} rupees after storage and handling costs. Estimated buyer-paid transportation is ${buyerTransportCharge} rupees for the selected delivery mode.`}
              />
            </>
          )}
        </Card>
      </Layout>
    );
  }

  /* =======================================================
     MARKET INTELLIGENCE
  ======================================================= */

  if (page === "market-intelligence") {
    return (
      <Layout
        {...layoutProps}
        title="📊 Market Intelligence"
      >
        <div className="grid three">
          <Card>
            <h3>Current Market Price</h3>
            <div className="market-price">
              ₹{marketPrice}/kg
            </div>
          </Card>

          <Card>
            <h3>Seasonal Demand</h3>
            <h2>{seasonalDemand}</h2>
          </Card>

          <Card>
            <h3>Recommended Price</h3>
            <h2>₹{recommendedPrice}/kg</h2>
          </Card>

          <Card>
            <h3>Historical Price Trend</h3>
            <p>
              Previous market range:
              ₹20/kg – ₹27/kg
            </p>
          </Card>

          <Card>
            <h3>Storage Threshold</h3>
            <h2>₹{thresholdPrice}/kg</h2>
          </Card>

          <Card>
            <h3>AI Recommendation</h3>
            <p>
              {farmerActiveLot &&
              Number(farmerActiveLot.price) <
                thresholdPrice
                ? "Current price is below the threshold. Storage can be considered."
                : "Current price is favorable for selling."}
            </p>
          </Card>
        </div>

        <Button
          onClick={() =>
            setMarketUpdated(
              (previous) => !previous
            )
          }
        >
          Simulate Live Market Update
        </Button>
      </Layout>
    );
  }

  /* =======================================================
     STORAGE FEASIBILITY
  ======================================================= */

  if (page === "storage-feasibility") {
    const storedQuantity = Number(farmerActiveLot?.quantity || 0);
    const currentUnitPrice = Number(farmerActiveLot?.price || 0);
    const storageDays = Math.max(0, Number(storagePlan.days || 0));
    const futureUnitPrice = Math.max(0, Number(storagePlan.futurePrice || 0));
    const dailyStorageCost = Math.max(0, Number(storagePlan.dailyCost || 0));
    const spoilagePercent = Math.min(100, Math.max(0, Number(storagePlan.spoilagePercent || 0)));
    const handlingPerKg = Math.max(0, Number(storagePlan.handlingCostPerKg || 0));
    const storageCostTotal = storedQuantity * storageDays * dailyStorageCost;
    const spoilageLoss = storedQuantity * spoilagePercent / 100 * futureUnitPrice;
    const handlingTotal = storedQuantity * handlingPerKg;
    const expectedBenefit = storedQuantity * (futureUnitPrice - currentUnitPrice) - storageCostTotal - spoilageLoss - handlingTotal;
    const storageScore = !farmerActiveLot ? 0 : Math.max(0, Math.min(100, Math.round(50 + (expectedBenefit / Math.max(1, storedQuantity * Math.max(currentUnitPrice, 1))) * 100)));
    const storageRecommendation = !farmerActiveLot ? "Add or select a crop lot to calculate storage feasibility." : expectedBenefit > 0 ? `Illustrative model estimates ₹${Math.round(expectedBenefit).toLocaleString("en-IN")} additional net benefit from storing ${storedQuantity} kg for ${storageDays} day(s). Verify the future price, actual storage availability, crop shelf life and quality loss first.` : `Selling now may be financially safer under these inputs. Storage and handling costs plus estimated spoilage are greater than the possible price gain by ₹${Math.round(Math.abs(expectedBenefit)).toLocaleString("en-IN")}.`;
    return (
      <Layout
        {...layoutProps}
        title="🏪 Storage Feasibility Intelligence"
      >
        <Card>
          <div className="score">
            {storageScore}/100
          </div>

          <h2>
            Status: {!farmerActiveLot ? "No Crop Selected" : expectedBenefit > 0 ? "Storage may be viable" : "Sell now / review inputs"}
          </h2>

          <p>
            {storageRecommendation}
          </p>

          <div className="warning"><strong>Decision checklist</strong><p>Compare expected future price with today's net sale value, storage charges, expected weight/quality loss, spoilage risk, and time to payment. Store only if the estimated net benefit remains positive.</p><p className="prototype-notice">Current score and nearby storage centres are prototype data, not verified live availability or quotations.</p></div>

          <AIVoiceExplanation
            language={language}
            text={storageRecommendation}
          />
        </Card>

        <Card className="form-card storage-calculator">
          <h2>Storage cost & spoilage calculator</h2>
          <p>Adjust the estimates for your crop, quantity and local storage quotation. This calculator compares additional selling revenue against storage, handling and spoilage.</p>
          <div className="grid two">
            <Input label="Storage duration (days)" type="number" min="0" value={storagePlan.days} onChange={(e) => setStoragePlan((p) => ({ ...p, days: e.target.value }))} />
            <Input label="Expected selling price after storage (₹/kg)" type="number" min="0" value={storagePlan.futurePrice} onChange={(e) => setStoragePlan((p) => ({ ...p, futurePrice: e.target.value }))} />
            <Input label="Storage charge (₹/kg/day)" type="number" min="0" step="0.05" value={storagePlan.dailyCost} onChange={(e) => setStoragePlan((p) => ({ ...p, dailyCost: e.target.value }))} />
            <Input label="Estimated spoilage / weight loss (%)" type="number" min="0" max="100" value={storagePlan.spoilagePercent} onChange={(e) => setStoragePlan((p) => ({ ...p, spoilagePercent: e.target.value }))} />
            <Input label="Handling cost (₹/kg)" type="number" min="0" value={storagePlan.handlingCostPerKg} onChange={(e) => setStoragePlan((p) => ({ ...p, handlingCostPerKg: e.target.value }))} />
          </div>
          <div className="grid three"><Card><p>Storage cost</p><h3>₹{Math.round(storageCostTotal).toLocaleString("en-IN")}</h3></Card><Card><p>Estimated spoilage loss</p><h3>₹{Math.round(spoilageLoss).toLocaleString("en-IN")}</h3></Card><Card><p>Net benefit vs selling now</p><h3 className={expectedBenefit >= 0 ? "profit-positive" : "profit-negative"}>₹{Math.round(expectedBenefit).toLocaleString("en-IN")}</h3></Card></div>
          <p className="prototype-notice">This is a what-if estimate, not a price forecast. Fresh crops can deteriorate quickly; verify crop-specific shelf life and a real storage quote before deciding.</p>
        </Card>

        <h2>Nearby Storage Centers (sample listings)</h2>

        {storageCenters.map((center) => (
          <div
            className="storage-center"
            key={center.name}
          >
            <h3>{center.name}</h3>

            <p>
              Distance: {center.distance}
            </p>

            <p>
              Estimated Charge:{" "}
              {center.charge}
            </p>
          </div>
        ))}
      </Layout>
    );
  }

  /* =======================================================
     FUTURE CROP PREDICTION
  ======================================================= */

  if (page === "future-prediction") {
    return (
      <Layout
        {...layoutProps}
        title="📈 Future Crop Prediction"
      >
        <p>
          AI prediction based on buyer demand,
          market activity and seasonal conditions.
        </p>

        <div className="grid">
          {futureCropPrediction.map(
            (prediction, index) => (
              <Card
                key={prediction.crop}
                className={
                  index === 0 ? "selected" : ""
                }
              >
                <h2>
                  #{index + 1} {prediction.crop}
                </h2>

                <div className="score">
                  {prediction.score}%
                </div>

                <p>
                  <strong>
                    Explainable AI:
                  </strong>{" "}
                  {prediction.reason}
                </p>
              </Card>
            )
          )}
        </div>
      </Layout>
    );
  }

  /* =======================================================
     AI RECOMMENDATIONS
  ======================================================= */

  if (page === "recommendations") {
    return (
      <Layout
        {...layoutProps}
        title="🤖 AI Opportunity Intelligence"
      >
        <Card>
          <h2>Opportunity Score</h2>

          <div className="score">
            {opportunityScore}/100
          </div>

          <p>
            Score considers quality, quantity,
            market condition, price and
            transaction reliability.
          </p>
        </Card>

        <div className="grid three">
          <Card className="selected">
            <h2>🥇 Sell Now</h2>

            <p>
              Estimated Net Return:
              ₹{estimatedNetReturn}
            </p>
          </Card>

          <Card>
            <h2>🥈 Wait</h2>

            <p>
              Possible improvement based on
              future demand.
            </p>
          </Card>

          <Card>
            <h2>🥉 Store</h2>

            <p>
              Storage Feasibility:
              {storageFeasibility.score}/100
            </p>
          </Card>
        </div>

        <Card>
          <h2>Explainable AI</h2>

          <p>
            The recommendations combine market
            price, seasonal demand, crop quality,
            storage feasibility, net return and
            transaction risk.
          </p>

          <AIVoiceExplanation
            language={language}
            text="The AI recommendations are based on crop quality, market conditions, expected profit, storage feasibility and transaction reliability."
          />
        </Card>
      </Layout>
    );
  }

  /* =======================================================
     CUSTOMER HISTORY
  ======================================================= */

  if (page === "customer-history") {
    return (
      <Layout
        {...layoutProps}
        title="👥 Customer History"
      >
        <div className="grid">
          {customers.map((customer) => (
            <Card key={customer.id}>
              <h2>{customer.customer}</h2>

              <p>
                Previous Transactions:
                {customer.transactions}
              </p>

              <p>
                Completed:
                {customer.completed}
              </p>

              <p>
                Disputes:
                {customer.disputed}
              </p>

              <p>
                Payment Score:
                {customer.paymentScore}/100
              </p>

              <h3>
                Reliability:
                {customer.reliability}
              </h3>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  /* =======================================================
     RISK INTELLIGENCE
  ======================================================= */

  if (page === "risk-intelligence") {
    return (
      <Layout
        {...layoutProps}
        title="⚠️ Transaction Risk Intelligence"
      >
        <Card>
          <h2>
            Overall Risk:
            {transactionRisk.level}
          </h2>

          <h3>
            Historical Completion Rate:
            {transactionRisk.completionRate}%
          </h3>

          <p>
            Explainable AI checks completed
            transactions, disputes and payment
            reliability.
          </p>

          <div
            className={
              transactionRisk.level === "Low"
                ? "success-box"
                : "warning"
            }
          >
            Recommendation: Review buyer history
            before confirming large transactions.
          </div>
        </Card>
      </Layout>
    );
  }

  /* =======================================================
     BUYER REQUIREMENTS VISIBLE TO FARMERS
  ======================================================= */

  if (page === "buyer-offers") {
    const activeLot = selectedLot || farmerActiveLot;
    const requestedQty = Math.max(0, Number(requirement.quantity || 0));
    const matchedQty = activeLot ? Math.min(Number(activeLot.quantity || 0), requestedQty) : 0;
    const cropMatches = Boolean(activeLot && activeLot.crop.trim().toLowerCase() === requirement.crop.trim().toLowerCase());
    const cropSaleAmount = activeLot ? matchedQty * Number(activeLot.price || 0) : 0;
    const buyerGpsPoint = requirement.gpsCoordinates || (role === "Buyer" ? gpsCoordinates : null);
    const farmerGpsPoint = activeLot?.gpsCoordinates || null;
    const gpsRouteDistanceKm = calculateDistanceKm(farmerGpsPoint, buyerGpsPoint);
    const routeDistanceKm = gpsRouteDistanceKm ?? Number(deliveryDistance || 0);
    const transportCharge = deliveryMode === "Buyer Pickup" ? 0 : estimateTransportCharge(routeDistanceKm, matchedQty);
    const storageAndHandling = Math.round(matchedQty * 0.5);
    const farmerNet = cropSaleAmount - storageAndHandling;
    const buyerTotal = cropSaleAmount + transportCharge;
    const matchTone = !activeLot ? "pending" : !cropMatches ? "risk" : matchedQty < requestedQty ? "pending" : "safe";
    return <Layout {...layoutProps} title="🤝 Buyer Requirements & Matching">
      <Card className="offer-review-card">
        <span className="dashboard-eyebrow">BUYER-POSTED REQUIREMENT · READ ONLY FOR FARMERS</span>
        <h2>🛒 Current buyer requirement</h2>
        <p>Buyer requirements are created from the Buyer dashboard. Farmers can review the demand and match their own crop lot here; do not enter buyer offer details manually.</p>
        <div className="grid two">
          <div><strong>Crop required</strong><p>{requirement.crop}</p></div>
          <div><strong>Quantity required</strong><p>{requestedQty.toLocaleString("en-IN")} kg</p></div>
          <div><strong>Delivery area</strong><p>{requirement.location || "Buyer location not provided"}</p></div>
          <div><strong>Required date</strong><p>{requirement.date || "Flexible / not specified"}</p></div>
          <div><strong>Quality requirement</strong><p>{requirement.quality}</p></div>
          <div><strong>Buyer / business</strong><p>{requirement.buyerName || "Buyer details required"}</p></div>
          <div><strong>Buyer contact</strong><p>{requirement.buyerContact ? `••••••${String(requirement.buyerContact).slice(-4)}` : "Contact not provided"}</p></div>
          <div><strong>Requirement status</strong><p>{activeLot && cropMatches ? "Potential crop match" : "Review match"}</p></div>
        </div>
      </Card>
      <Card className="offer-review-card">
        <h2>🌾 Match with your crop lot</h2>
        {activeLot ? <>
          <p><strong>Your crop:</strong> {activeLot.crop} · {Number(activeLot.quantity).toLocaleString("en-IN")} kg available · ₹{Number(activeLot.price).toLocaleString("en-IN")}/kg</p>
          <div className={`offer-verdict ${matchTone}`}><strong>{!cropMatches ? "CROP DOES NOT MATCH" : matchedQty < requestedQty ? "PARTIAL QUANTITY MATCH" : "CROP & QUANTITY MATCH"}</strong><p>{!cropMatches ? `Buyer requires ${requirement.crop}; your lot is ${activeLot.crop}. Choose a matching lot before responding.` : matchedQty < requestedQty ? `Your lot can supply ${matchedQty.toLocaleString("en-IN")} kg of ${requestedQty.toLocaleString("en-IN")} kg. Remaining quantity: ${(requestedQty-matchedQty).toLocaleString("en-IN")} kg.` : "Your listed quantity meets the requested quantity. Confirm delivery responsibility and the estimated net return before proceeding."}</p></div>
          <Select label="Delivery responsibility (farmer selects)" value={deliveryMode} onChange={(e) => setDeliveryMode(e.target.value)}>
            <option>Buyer Pickup</option><option>Farmer Delivery</option><option>Logistics Provider</option>
          </Select>
          <div className="location-route-summary"><strong>📍 Route distance:</strong> {gpsRouteDistanceKm !== null ? `${gpsRouteDistanceKm} km (calculated automatically from GPS)` : `GPS route unavailable — provisional estimate uses ${Number(deliveryDistance || 0)} km. Capture both locations for an accurate route.`}</div>
          <div className="grid two">
            <Card><p>Estimated crop amount</p><h2>₹{Math.round(cropSaleAmount).toLocaleString("en-IN")}</h2><small>Listed price × matched quantity; not a confirmed buyer offer.</small></Card>
            <Card><p>Transport charge paid by buyer</p><h2>₹{Math.round(transportCharge).toLocaleString("en-IN")}</h2><small>{deliveryMode === "Buyer Pickup" ? "₹0 — buyer collects the crop." : "Added separately to the buyer's total; not deducted from farmer crop proceeds."}</small></Card>
            <Card><p>Estimated farmer net return</p><h2>₹{Math.round(farmerNet).toLocaleString("en-IN")}</h2><small>Crop amount − estimated storage and handling. Transport is billed separately to buyer where applicable.</small></Card>
            <Card><p>Estimated buyer total</p><h2>₹{Math.round(buyerTotal).toLocaleString("en-IN")}</h2><small>Crop amount + buyer-paid transport.</small></Card>
          </div>
          <p className="prototype-notice">This is a local prototype. A requirement match is not the same as a buyer-confirmed order. In production, the buyer must accept the farmer's proposal through a shared backend before an order is confirmed.</p>
          <Button disabled={!cropMatches || matchedQty <= 0 || !requirement.buyerName || String(requirement.buyerContact || "").replace(/\D/g, "").length !== 10 || !requirement.gpsCoordinates} onClick={() => { setSelectedLot(activeLot); setBuyerOffer({ amount: String(Math.round(cropSaleAmount)), quantity: String(matchedQty), deliveryLocation: requirement.location || "Buyer GPS location" }); setTransactionDetails((previous) => ({ ...previous, buyerName: requirement.buyerName || previous.buyerName, phone: requirement.buyerContact || previous.phone, address: requirement.location || previous.address })); navigate("transaction-details"); }}>Prepare matched order details →</Button>
          {(!requirement.buyerName || String(requirement.buyerContact || "").replace(/\D/g, "").length !== 10 || !requirement.gpsCoordinates) && <p className="prototype-notice">Buyer must save a valid name, 10-digit phone number and automatic GPS location before an order can proceed.</p>}
        </> : <p>Add a crop listing first. Your available crop lots will appear here for matching.</p>}
      </Card>
      <section className="dashboard-section"><div className="dashboard-section-heading"><div><span className="dashboard-eyebrow">CHANNEL READINESS</span><h2>Potential selling channels</h2></div></div><div className="grid three">
        {[{name:"Local buyers / retailers",desc:"Direct negotiation and nearby delivery",status:"Available in prototype"},{name:"FPO / Cooperative",desc:"Aggregate quantities and coordinate pickup",status:"Matching workflow"},{name:"Blinkit / Flipkart / online retail",desc:"Potential channel only; seller onboarding and platform API access required",status:"Not connected"}].map((channel) => <Card key={channel.name}><h3>{channel.name}</h3><p>{channel.desc}</p><span className="channel-status">{channel.status}</span></Card>)}
      </div><p className="prototype-notice">No external marketplace is connected. These options do not publish listings or transmit orders to any platform.</p></section>
    </Layout>;
  }

  /* =======================================================
     LOGISTICS
  ======================================================= */

  if (page === "logistics") {
    const logisticsCost = Math.round(
      Number(deliveryDistance || 0) *
        Number(farmerActiveLot?.quantity || 0) *
        0.03
    );

    return (
      <Layout
        {...layoutProps}
        title="🚛 Smart Logistics & Live Tracking"
      >
        <Card className="form-card">
          <Input
            label="Estimated Distance (km)"
            type="number"
            value={deliveryDistance}
            onChange={(e) =>
              setDeliveryDistance(e.target.value)
            }
          />

          <Select
            label="Delivery Responsibility"
            value={deliveryMode}
            onChange={(e) =>
              setDeliveryMode(e.target.value)
            }
          >
            <option>Buyer Pickup</option>
            <option>Farmer Delivery</option>
            <option>Logistics Provider</option>
          </Select>

          <h3>Estimated transport charge: ₹{deliveryMode === "Buyer Pickup" ? 0 : logisticsCost}</h3>
          <p className="prototype-notice">{deliveryMode === "Buyer Pickup" ? "Buyer collects the crop: no transport charge is added by this app." : "Transport is shown as an extra buyer-paid charge; it is not deducted from the farmer's crop proceeds."}</p>
        </Card>

        <Card className="tracking-box">
          <h2>📍 Live Crop Load Tracking</h2>

          <p>Map location comes from the current device GPS when permission is granted. This prototype does not track a vehicle in real time; courier GPS requires a driver app and backend sharing.</p>
          {gpsCoordinates && <><div className="location-map-card"><iframe title="Current logistics device location" className="location-map-frame" loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${gpsCoordinates.longitude - 0.02}%2C${gpsCoordinates.latitude - 0.02}%2C${gpsCoordinates.longitude + 0.02}%2C${gpsCoordinates.latitude + 0.02}&layer=mapnik&marker=${gpsCoordinates.latitude}%2C${gpsCoordinates.longitude}`} /></div><a className="map-open-link" href={`https://www.google.com/maps?q=${gpsCoordinates.latitude},${gpsCoordinates.longitude}`} target="_blank" rel="noreferrer">Open current GPS location in Google Maps ↗</a></>}

          <div className="tracking-line">
            <div
              className="tracking-progress"
              style={{
                width: `${trackingProgress}%`,
              }}
            />
          </div>

          <div className="tracking-points">
            <span>🚜 Farmer</span>
            <span>🚚 Current Load</span>
            <span>🏢 Buyer</span>
          </div>

          <p>
            Current Route Progress:
            {trackingProgress}%
          </p>

          <Button
            onClick={() =>
              setTrackingProgress((previous) =>
                Math.min(100, previous + 10)
              )
            }
          >
            Update Live Position
          </Button>
        </Card>
      </Layout>
    );
  }

  /* =======================================================
     BUYER DASHBOARD
  ======================================================= */

  if (page === "buyer-dashboard") {
    const items = [
      ["🛒", "Create / Edit Requirement", "buyer-requirement"],
      ["🔍", "Search Crops", "buyer-search"],
      ["📊", "AI Supply Matching", "supply-matching"],
      ["📦", "Dynamic Supply Aggregation", "aggregation"],
      ["💳", "My Orders & Payments", "payments"],
      ["🔔", "Notifications & Risk Alerts", "notifications"],
      ["📦", "Order Tracking", "orders"],
      ["🚛", "Live Load Tracking", "logistics"],
      ["📡", "Offline Mode", "offline-support"],
      ["👤", "Profile", "profile"],
    ];

    return (
      <Layout
        {...layoutProps}
        title={`🏢 ${t.buyer} ${t.dashboard}`}
        showNavigation={false}
      >
        <Card className="location-map-card buyer-location-card">
          <h2>📍 Your current location</h2>
          <p>{gpsCoordinates ? `Location detected automatically · ±${gpsCoordinates.accuracy} m accuracy` : `${gpsStatus}. Allow browser location access to show the map.`}</p>
          {gpsCoordinates && <><p>{gpsCoordinates.latitude}, {gpsCoordinates.longitude}</p><iframe title="Buyer current location map" className="location-map-frame" loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${gpsCoordinates.longitude - 0.01}%2C${gpsCoordinates.latitude - 0.01}%2C${gpsCoordinates.longitude + 0.01}%2C${gpsCoordinates.latitude + 0.01}&layer=mapnik&marker=${gpsCoordinates.latitude}%2C${gpsCoordinates.longitude}`} /><a href={`https://www.openstreetmap.org/?mlat=${gpsCoordinates.latitude}&mlon=${gpsCoordinates.longitude}#map=15/${gpsCoordinates.latitude}/${gpsCoordinates.longitude}`} target="_blank" rel="noreferrer">Open full map ↗</a></>}
        </Card>
        <div className="grid three">
          {items.map(([icon, label, target]) => (
            <Card key={target}>
              <h2>{icon}</h2>
              <h3>{label}</h3>

              <Button
                onClick={() => navigate(target)}
              >
                Open
              </Button>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  /* =======================================================
     BUYER REQUIREMENT WITH EDIT
  ======================================================= */

  if (page === "buyer-requirement") {
    return (
      <Layout
        {...layoutProps}
        title="🛒 Buyer Requirement"
      >
        <Card className="form-card">
          {!requirementEditing ? (
            <>
              <div className="requirement-summary">
                <h2>{requirement.crop}</h2>

                <p>
                  Quantity:
                  {requirement.quantity} kg
                </p>

                <p>
                  Location:
                  {requirement.location}
                </p>

                <p>
                  Quality:
                  {requirement.quality}
                </p>

                <Button
                  onClick={() =>
                    setRequirementEditing(true)
                  }
                >
                  ✏️ {t.edit}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Input
                label={t.requiredCrop}
                value={requirement.crop}
                onChange={(e) =>
                  setRequirement((previous) => ({
                    ...previous,
                    crop: e.target.value,
                  }))
                }
              />

              <VoiceInput
                language={language}
                buttonText={t.voiceInput}
                onResult={(text) =>
                  setRequirement((previous) => ({
                    ...previous,
                    crop: text,
                  }))
                }
              />

              <Input
                label={t.requiredQuantity}
                type="number"
                value={requirement.quantity}
                onChange={(e) =>
                  setRequirement((previous) => ({
                    ...previous,
                    quantity: e.target.value,
                  }))
                }
              />

              <Input
                label="Pickup / delivery location (automatic GPS) *"
                value={requirement.location || (gpsCoordinates ? `GPS ${gpsCoordinates.latitude}, ${gpsCoordinates.longitude}` : "Waiting for GPS permission…")}
                readOnly
                placeholder="Allow location permission to capture your location"
              />
              <p className="prototype-notice">Location is captured automatically from your device and cannot be typed manually. The map appears when GPS is available.</p>
              {gpsCoordinates && <div className="location-map-card"><iframe title="Buyer requirement GPS map" className="location-map-frame" loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${gpsCoordinates.longitude - 0.01}%2C${gpsCoordinates.latitude - 0.01}%2C${gpsCoordinates.longitude + 0.01}%2C${gpsCoordinates.latitude + 0.01}&layer=mapnik&marker=${gpsCoordinates.latitude}%2C${gpsCoordinates.longitude}`} /></div>}
              <Input
                label="Buyer / Business name *"
                value={requirement.buyerName || userName}
                onChange={(e) => setRequirement((previous) => ({ ...previous, buyerName: e.target.value }))}
                placeholder="Enter buyer or business name"
              />
              <Input
                label="Buyer phone number (10 digits) *"
                value={requirement.buyerContact || contact}
                onChange={(e) => setRequirement((previous) => ({ ...previous, buyerContact: e.target.value.replace(/[^0-9]/g, "").slice(0, 10) }))}
                placeholder="10-digit mobile number"
              />

              <Input
                label={t.requiredDate}
                type="date"
                value={requirement.date}
                onChange={(e) =>
                  setRequirement((previous) => ({
                    ...previous,
                    date: e.target.value,
                  }))
                }
              />

              <Select
                label={t.requiredQuality}
                value={requirement.quality}
                onChange={(e) =>
                  setRequirement((previous) => ({
                    ...previous,
                    quality: e.target.value,
                  }))
                }
              >
                <option>A Grade</option>
                <option>B Grade</option>
                <option>Any Quality</option>
              </Select>

              <Button
                onClick={() => {
                  const buyerName = String(requirement.buyerName || userName || "").trim();
                  const buyerPhone = String(requirement.buyerContact || contact || "").replace(/\D/g, "");
                  if (!buyerName || buyerPhone.length !== 10 || !requirement.gpsCoordinates) {
                    alert("Required: buyer/business name, valid 10-digit phone number and automatic GPS location. Allow location access and complete all fields.");
                    return;
                  }
                  if (!String(requirement.crop || "").trim() || Number(requirement.quantity) <= 0) {
                    alert("Please select a crop and enter a quantity greater than zero.");
                    return;
                  }
                  setRequirement((previous) => ({ ...previous, buyerName, buyerContact: buyerPhone, location: `GPS ${requirement.gpsCoordinates.latitude}, ${requirement.gpsCoordinates.longitude}` }));
                  setRequirementEditing(false);
                }}
              >
                {t.save} Requirement
              </Button>
            </>
          )}

          <Button
            onClick={() =>
              navigate("buyer-search")
            }
          >
            Find Supply
          </Button>
        </Card>
      </Layout>
    );
  }

  /* =======================================================
     BUYER SEARCH
  ======================================================= */

  if (page === "buyer-search") {
    return (
      <Layout
        {...layoutProps}
        title="🔍 Available Farmers & Crops"
      >
        <h2>
          Compatible Lots Found:
          {matches.length}
        </h2>

        <div className="grid">
          {matches.map((lot) => (
            <Card key={lot.id}>
              <div className="farmer-details">
                {lot.image ? (
                  <img
                    src={lot.image}
                    alt={lot.crop}
                    className="farmer-profile-image"
                  />
                ) : (
                  <div className="farmer-profile-image">
                    🌾
                  </div>
                )}

                <div className="farmer-info">
                  <h2>{lot.farmer}</h2>

                  <p>
                    📱 Phone: {lot.phone}
                  </p>

                  <p>
                    🌱 Crop: {lot.crop}
                  </p>

                  <p>
                    📦 Quantity:
                    {lot.quantity} kg
                  </p>

                  <p>
                    📍 Location:
                    {lot.location}
                  </p>

                  <p>
                    ⭐ AI Grade:
                    {lot.aiGrade || lot.quality}
                  </p>

                  <p>
                    💰 Price:
                    ₹{lot.price}/kg
                  </p>
                </div>
              </div>

              <Button
                className="secondary"
                onClick={() => {
                  setSelectedLot(lot);
                  navigate("buyer-inquiry");
                }}
              >
                💬 {t.askQuestion}
              </Button>

              <Button
                onClick={() => {
                  setSelectedLot(lot);

                  setBuyerOffer({
                    amount:
                      lot.price * lot.quantity,
                    quantity: lot.quantity,
                    deliveryLocation:
                      requirement.location,
                  });

                  navigate("transaction-details");
                }}
              >
                🛒 {t.buyNow}
              </Button>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  /* =======================================================
     BUYER INQUIRY
  ======================================================= */

  if (page === "buyer-inquiry") {
    function sendQuestion() {
      if (!question.trim()) return;

      setMessages((previous) => [
        ...previous,
        {
          from: "Buyer",
          text: question,
        },
        {
          from: "AI System",
          text:
            "Your question has been recorded and shared with the farmer.",
        },
      ]);

      setQuestion("");
    }

    return (
      <Layout
        {...layoutProps}
        title="💬 Ask Farmer"
      >
        <Card>
          <h2>
            {selectedLot?.farmer}
          </h2>

          <div className="messages">
            {messages.map(
              (message, index) => (
                <p
                  key={index}
                  className={
                    message.from === "Buyer"
                      ? "buyer-msg"
                      : "ai-msg"
                  }
                >
                  <strong>
                    {message.from}:
                  </strong>{" "}
                  {message.text}
                </p>
              )
            )}
          </div>

          <Input
            label="Ask a Question"
            value={question}
            onChange={(e) =>
              setQuestion(e.target.value)
            }
          />

          <VoiceInput
            language={language}
            buttonText={t.voiceInput}
            onResult={setQuestion}
          />

          <Button onClick={sendQuestion}>
            Send Question
          </Button>

          <Button
            onClick={() => {
              if (selectedLot) {
                setBuyerOffer({
                  amount:
                    selectedLot.price *
                    selectedLot.quantity,
                  quantity:
                    selectedLot.quantity,
                  deliveryLocation:
                    requirement.location,
                });

                navigate("transaction-details");
              }
            }}
          >
            🛒 {t.buyNow}
          </Button>
        </Card>
      </Layout>
    );
  }

  /* =======================================================
     TRANSACTION DETAILS
  ======================================================= */

  if (page === "transaction-details") {
    const requirementGpsMatch = String(requirement.location || "").match(/GPS\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i);
    const savedBuyerGps = requirement.gpsCoordinates || (requirementGpsMatch ? { latitude: Number(requirementGpsMatch[1]), longitude: Number(requirementGpsMatch[2]) } : null);
    const deliveryGpsCoordinates = savedBuyerGps || (role === "Buyer" ? gpsCoordinates : null);
    const farmerGpsCoordinates = selectedLot?.gpsCoordinates || cropForm.gpsCoordinates || null;
    const gpsRouteDistanceKm = calculateDistanceKm(farmerGpsCoordinates, deliveryGpsCoordinates);
    const transactionRouteDistanceKm = gpsRouteDistanceKm ?? Number(deliveryDistance || 0);
    const transactionTransportCharge = deliveryMode === "Buyer Pickup" ? 0 : estimateTransportCharge(transactionRouteDistanceKm, Number(buyerOffer.quantity || selectedLot?.quantity || 0));

    function startTransaction() {
      const normalizedPhone = String(transactionDetails.phone || "").replace(/\D/g, "");
      if (!String(transactionDetails.buyerName || "").trim() || normalizedPhone.length !== 10 || !deliveryGpsCoordinates || !transactionDetails.paymentMethod) {
        alert("Required before ordering: buyer/business name, valid 10-digit phone number, automatic GPS location and payment method. Allow browser location permission.");
        return;
      }

      const newTransaction = {
        id: `TXN-${Date.now()}`,
        customer: transactionDetails.buyerName.trim(),
        customerContact: normalizedPhone,
        farmer: selectedLot?.farmer || userName || "Listed Farmer",
        farmerContact: selectedLot?.phone || contact,
        crop: selectedLot?.crop || "Crop order",
        quantity: Number(buyerOffer.quantity || selectedLot?.quantity || 0),
        cropAmount: Number(buyerOffer.amount) || sellingValue || 0,
        transportCharge: transactionTransportCharge,
        deliveryMode,
        farmerNetReturn: (Number(buyerOffer.amount) || sellingValue || 0) - Math.round(Number(buyerOffer.quantity || selectedLot?.quantity || 0) * 0.5),
        amount: (Number(buyerOffer.amount) || sellingValue || 0) + transactionTransportCharge,
        paymentMethod: transactionDetails.paymentMethod,
        status: "Order Received",
        paymentStatus: transactionDetails.paymentMethod === "Cash on Delivery"
          ? "COD — collect on delivery"
          : "Payment Pending",
        buyerGpsCoordinates: deliveryGpsCoordinates ? { ...deliveryGpsCoordinates } : null,
        farmerGpsCoordinates: selectedLot?.gpsCoordinates || cropForm.gpsCoordinates || null,
        buyerLocationText: requirement.location || transactionDetails.address || "",
        farmerLocationText: selectedLot?.location || cropForm.location || "",
        timeline: [{ status: "Order Received", at: new Date().toISOString(), note: "Order placed; payment has not been confirmed." }],
        paymentVerificationRequested: false,
        date: new Date().toISOString().split("T")[0],
      };

      setTransactions((previous) => [newTransaction, ...previous]);
      setPaymentStatus(newTransaction.paymentStatus);
      setOrderStatus("Order Received");

      navigate("payments");
    }

    return (
      <Layout
        {...layoutProps}
        title="💳 Professional Transaction Details"
      >
        <Card className="form-card transaction-flow-card">
          <div className="transaction-stepper"><span className="current">1. Order details</span><span>2. Pickup</span><span>3. Delivery</span><span>4. Payment</span></div>
          <h2>
            Selected Crop:
            {selectedLot?.crop}
          </h2>

          <p>
            Farmer:
            {selectedLot?.farmer}
          </p>

          <p>
            Quantity:
            {buyerOffer.quantity || selectedLot?.quantity} kg
          </p>

          <p>Crop amount: ₹{Number(buyerOffer.amount || 0).toLocaleString("en-IN")}</p>
          <p>Delivery mode: <strong>{deliveryMode}</strong></p>
          <p>GPS route distance: {gpsRouteDistanceKm !== null ? `${gpsRouteDistanceKm} km` : `GPS route unavailable; provisional ${Number(deliveryDistance || 0)} km estimate`}</p>
          <p>Transport charge paid by buyer: ₹{transactionTransportCharge.toLocaleString("en-IN")}</p>
          <p><strong>Buyer total: ₹{(Number(buyerOffer.amount || 0) + transactionTransportCharge).toLocaleString("en-IN")}</strong></p>

          <Input
            label="Buyer / Organization Name *"
            value={transactionDetails.buyerName}
            onChange={(e) =>
              setTransactionDetails(
                (previous) => ({
                  ...previous,
                  buyerName: e.target.value,
                })
              )
            }
          />

          <Input
            label="Buyer Phone Number (10 digits) *"
            value={transactionDetails.phone}
            onChange={(e) =>
              setTransactionDetails(
                (previous) => ({
                  ...previous,
                  phone: e.target.value.replace(/[^0-9]/g, "").slice(0, 10),
                })
              )
            }
          />

          <Input label="Buyer delivery location (automatic GPS) *" value={deliveryGpsCoordinates ? `GPS ${deliveryGpsCoordinates.latitude}, ${deliveryGpsCoordinates.longitude}` : "GPS unavailable — allow location permission"} readOnly placeholder="Buyer must allow GPS permission" />
          {!deliveryGpsCoordinates && <p className="prototype-notice">GPS is mandatory for this order. Allow location access, then reopen this screen.</p>}
          {deliveryGpsCoordinates && <div className="location-map-card"><iframe title="Buyer delivery location map" className="location-map-frame" loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${deliveryGpsCoordinates.longitude - 0.01}%2C${deliveryGpsCoordinates.latitude - 0.01}%2C${deliveryGpsCoordinates.longitude + 0.01}%2C${deliveryGpsCoordinates.latitude + 0.01}&layer=mapnik&marker=${deliveryGpsCoordinates.latitude}%2C${deliveryGpsCoordinates.longitude}`} /></div>}

          <Select
            label="Payment Method"
            value={
              transactionDetails.paymentMethod
            }
            onChange={(e) =>
              setTransactionDetails(
                (previous) => ({
                  ...previous,
                  paymentMethod:
                    e.target.value,
                })
              )
            }
          >
            <option value="">
              Select Payment Method
            </option>

            <option>UPI</option>
            <option>Bank Transfer</option>
            {codEnabled && <option>Cash on Delivery</option>}
          </Select>

          <div className="transaction-assurance"><strong>Before you continue</strong><p>Confirm crop quantity, buyer name and phone number, GPS pickup/delivery point, and the total. COD remains pending until the farmer confirms delivery and actually receives cash. UPI/bank payment remains pending until a real provider confirms it. This prototype does not move money.</p></div>
          <Button onClick={startTransaction}>Confirm order details →</Button>
        </Card>
      </Layout>
    );
  }

  /* =======================================================
     SUPPLY MATCHING
  ======================================================= */

  if (page === "supply-matching") {
    return (
      <Layout
        {...layoutProps}
        title="📊 AI Supply Matching"
      >
        <Card>
          <h2>Buyer Requirement</h2>

          <p>
            {requirement.quantity} kg{" "}
            {requirement.crop}
          </p>

          <p>
            AI Compatible Supply:
            {totalSupply} kg
          </p>

          {matches.map((lot) => (
            <p key={lot.id}>
              ✅ {lot.farmer} →
              {lot.quantity} kg •
              {lot.location}
            </p>
          ))}

          <div className="success-box">
            Explainable AI matches crop,
            quality, quantity and
            availability.
          </div>

          <Button
            onClick={() =>
              navigate("aggregation")
            }
          >
            Build Dynamic Aggregation
          </Button>
        </Card>
      </Layout>
    );
  }

  /* =======================================================
     DYNAMIC AGGREGATION
  ======================================================= */

  if (page === "aggregation") {
    function toggleLot(id) {
      setConfirmedIds((previous) =>
        previous.includes(id)
          ? previous.filter(
              (item) => item !== id
            )
          : [...previous, id]
      );
    }

    return (
      <Layout
        {...layoutProps}
        title="📦 Dynamic AI Supply Aggregation"
      >
        <div className="grid">
          {matches.map((lot) => {
            const selected =
              confirmedIds.includes(lot.id);

            return (
              <Card
                key={lot.id}
                className={
                  selected ? "selected" : ""
                }
              >
                <h2>{lot.farmer}</h2>

                <p>
                  Quantity:
                  {lot.quantity} kg
                </p>

                <p>
                  Location:
                  {lot.location}
                </p>

                <Button
                  className={
                    selected ? "success" : ""
                  }
                  onClick={() =>
                    toggleLot(lot.id)
                  }
                >
                  {selected
                    ? "Confirmed"
                    : "Add to Aggregation"}
                </Button>
              </Card>
            );
          })}
        </div>

        <Card>
          <h2>
            Aggregated Quantity:
            {confirmedQuantity} kg
          </h2>

          <h2>
            Remaining Requirement:
            {remainingQuantity} kg
          </h2>
        </Card>
      </Layout>
    );
  }

  /* =======================================================
     FPO DASHBOARD
  ======================================================= */

  if (page === "fpo-dashboard") {
    return (
      <Layout
        {...layoutProps}
        title="🏘️ FPO Dashboard"
        showNavigation={false}
      >
        <div className="grid three">
          <Card>
            <h2>👨‍🌾 Member Farmers</h2>

            <Button
              onClick={() =>
                navigate("fpo-members")
              }
            >
              Open
            </Button>
          </Card>

          <Card>
            <h2>📦 Crop Aggregation</h2>

            <Button
              onClick={() =>
                navigate("fpo-lots")
              }
            >
              Open
            </Button>
          </Card>

          <Card>
            <h2>📊 Supply Intelligence</h2>

            <Button
              onClick={() =>
                navigate("supply-matching")
              }
            >
              Open
            </Button>
          </Card>

          <Card>
            <h2>🚛 Logistics</h2>

            <Button
              onClick={() =>
                navigate("logistics")
              }
            >
              Open
            </Button>
          </Card>

          <Card>
            <h2>💳 Transactions</h2>

            <Button
              onClick={() =>
                navigate("payments")
              }
            >
              Open
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  /* =======================================================
     FPO MEMBERS
  ======================================================= */

  if (page === "fpo-members") {
    return (
      <Layout
        {...layoutProps}
        title="👨‍🌾 FPO Member Farmers"
      >
        <div className="grid">
          {lots.map((lot) => (
            <Card key={lot.id}>
              <h2>{lot.farmer}</h2>

              <p>Crop: {lot.crop}</p>

              <p>
                Quantity:
                {lot.quantity} kg
              </p>

              <p>
                Location:
                {lot.location}
              </p>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  /* =======================================================
     FPO LOTS
  ======================================================= */

  if (page === "fpo-lots") {
    const total = lots.reduce(
      (sum, lot) =>
        sum + Number(lot.quantity),
      0
    );

    return (
      <Layout
        {...layoutProps}
        title="📦 FPO Crop Aggregation"
      >
        <Card>
          <h2>
            Total Available Supply:
            {total} kg
          </h2>

          <p>
            The FPO coordinates farmers and
            aggregates supply for bulk buyers.
          </p>
        </Card>
      </Layout>
    );
  }

  /* =======================================================
     ROLE-SPECIFIC NOTIFICATIONS & RISK ALERTS
  ======================================================= */

  if (page === "notifications") {
    const roleTransactions = transactions.filter((item) => role === "Buyer"
      ? String(item.customer || "").toLowerCase() === String(userName || "").toLowerCase()
      : role === "Farmer" ? (item.farmerContact === contact || !item.farmer || item.farmer === userName || item.farmer === "Listed Farmer") : true);
    const alerts = [
      ...roleTransactions.map((item) => ({ id: item.id, title: `${item.id} · ${item.status}`, detail: `${item.crop || "Crop order"} · ₹${Number(item.amount || 0).toLocaleString("en-IN")} · ${item.paymentStatus}`, tone: item.paymentStatus === "Payment Pending" || String(item.paymentStatus).startsWith("COD") ? "pending" : "safe" })),
      ...(role === "Farmer" ? [
        { id: "buyer-demand", title: `Buyer requirement: ${requirement.crop}`, detail: `${Number(requirement.quantity || 0).toLocaleString("en-IN")} kg required · ${requirement.location || "buyer location pending"} · Open Buyer Requirements & Matches to compare with your crop lots.`, tone: "pending" },
        { id: "risk-cod", title: "COD collection reminder", detail: "Confirm delivery first and mark cash received only after cash is actually collected. Never mark a pending payment as received.", tone: "pending" },
        { id: "risk-offer", title: "Buyer / offer risk check", detail: "Review quantity, crop grade, buyer identity, delivery terms and unusual pricing. This prototype cannot verify buyer identity or payment ability.", tone: "pending" },
        { id: "risk-transport", title: "Transportation charge check", detail: deliveryMode === "Buyer Pickup" ? "Buyer pickup selected: transport charge should be ₹0 in this estimate." : "Farmer delivery / logistics selected: show transport as a separate buyer-paid charge, not as a deduction from farmer crop proceeds.", tone: "pending" }
      ] : []),
      ...(role === "Buyer" ? [{ id: "buyer-payment", title: "Payment safety reminder", detail: "Use the payment method shown on your confirmed order. A pending or demo status is not proof of payment.", tone: "pending" }] : []),
    ];
    return <Layout {...layoutProps} title="🔔 Notifications & Risk Alerts"><Card><h2>{role === "Farmer" ? "Farmer alerts" : role === "Buyer" ? "Buyer order updates" : "Transaction alerts"}</h2><p>Updates are generated from this browser prototype. Push/SMS notifications and cross-device syncing need a backend notification service.</p></Card><div className="grid two">{alerts.map((alert) => <Card key={alert.id} className="notification-card"><span className={`status-pill ${alert.tone === "pending" ? "status-pending" : "status-success"}`}>{alert.tone === "pending" ? "ACTION / REVIEW" : "UPDATE"}</span><h3>{alert.title}</h3><p>{alert.detail}</p></Card>)}</div>{alerts.length === 0 && <Card><p>No order-specific notifications yet. Your order updates will appear here.</p></Card>}<Button className="secondary" onClick={() => navigate(getDashboard())}>← Back to dashboard</Button></Layout>;
  }

  /* =======================================================
     PAYMENTS — BUYER AND FARMER VIEWS
  ======================================================= */

  if (page === "payments") {
    const isFarmer = role === "Farmer";
    const isBuyer = role === "Buyer";

    function updateTransaction(transactionId, updates) {
      setTransactions((previous) => previous.map((item) => {
        if (item.id !== transactionId) return item;
        const statusChanged = updates.status && updates.status !== item.status;
        const paymentChanged = updates.paymentStatus && updates.paymentStatus !== item.paymentStatus;
        const event = statusChanged || paymentChanged ? {
          status: updates.status || item.status,
          paymentStatus: updates.paymentStatus || item.paymentStatus,
          at: new Date().toISOString(),
          note: updates.note || (paymentChanged ? "Payment status updated; this does not itself confirm a bank transfer." : "Order milestone updated."),
        } : null;
        return { ...item, ...updates, timeline: event ? [...(item.timeline || []), event] : (item.timeline || []) };
      }));
    }

    function confirmCashReceived(transaction) {
      if (transaction.status !== "Delivered") {
        alert("Mark the order as Delivered before confirming cash collection.");
        return;
      }
      updateTransaction(transaction.id, {
        status: "Completed",
        paymentStatus: "Cash Collected",
        cashCollectedAt: new Date().toISOString(),
      });
      setPaymentStatus("Cash Collected");
    }

    return (
      <Layout
        {...layoutProps}
        title={isBuyer ? "💳 Buyer Payments & Orders" : isFarmer ? "💳 Farmer Payments & Transactions" : "💳 Payment & Transaction Tracking"}
      >
        <Card className="order-tracking-card">
          <div className="order-tracking-header">
            <span className="dashboard-eyebrow">SECURE TRANSACTION FLOW</span>
            <h2>{isBuyer ? "Your purchases and payment status" : isFarmer ? "Your sales and payment collection" : "Payment & Transaction Tracking"}</h2>
            <p>Buyer and farmer views use the same transaction records in this browser prototype. Real multi-device syncing and payment confirmation require a backend and payment provider.</p>
          </div>
          <div className="transaction-assurance">
            <strong>Cash on Delivery (COD)</strong>
            <p>COD is available only when the farmer accepts it. The farmer should mark cash received only after delivery and actual cash collection. This prototype does not collect or transfer real money.</p>
          </div>
        </Card>

        <h2>{isBuyer ? "My Orders" : isFarmer ? "Orders to Fulfil & Payments to Collect" : "Transaction History"}</h2>
        {(isBuyer ? transactions.filter((item) => String(item.customer || "").toLowerCase() === String(userName || "").toLowerCase()) : isFarmer ? transactions.filter((item) => item.farmerContact === contact || !item.farmer || item.farmer === userName || item.farmer === "Listed Farmer") : transactions).length === 0 ? (
          <Card><p>{isBuyer ? "You have no orders linked to this buyer profile yet." : "No farmer orders or transactions are linked to this profile yet."}</p></Card>
        ) : (
          <div className="grid">
            {(isBuyer ? transactions.filter((item) => String(item.customer || "").toLowerCase() === String(userName || "").toLowerCase()) : isFarmer ? transactions.filter((item) => item.farmerContact === contact || !item.farmer || item.farmer === userName || item.farmer === "Listed Farmer") : transactions).map((transaction) => {
              const isCOD = transaction.paymentMethod === "Cash on Delivery";
              const isPendingCOD = isCOD && !["Cash Collected", "Payment Received"].includes(transaction.paymentStatus);
              return (
                <Card key={transaction.id} className="transaction-card">
                  <div className="transaction-card-heading">
                    <h3>{transaction.id}</h3>
                    <span className={`status-pill ${transaction.status === "Completed" ? "status-success" : "status-pending"}`}>{transaction.status}</span>
                  </div>
                  <p><strong>Buyer:</strong> {transaction.customer}</p>
                  <p><strong>Farmer:</strong> {transaction.farmer || "Listed Farmer"}</p>
                  {transaction.crop && <p><strong>Crop:</strong> {transaction.crop}{transaction.quantity ? ` · ${transaction.quantity} kg` : ""}</p>}
                  <p><strong>Crop amount:</strong> ₹{Number(transaction.cropAmount ?? transaction.amount ?? 0).toLocaleString("en-IN")}</p>
                  <p><strong>Delivery mode:</strong> {transaction.deliveryMode || "Not recorded"}</p>
                  <p><strong>Transport charge (buyer-paid):</strong> ₹{Number(transaction.transportCharge || 0).toLocaleString("en-IN")}</p>
                  <p><strong>Buyer total:</strong> ₹{Number(transaction.amount || 0).toLocaleString("en-IN")}</p>
                  {transaction.farmerNetReturn !== undefined && <p><strong>Estimated farmer net return:</strong> ₹{Number(transaction.farmerNetReturn).toLocaleString("en-IN")}</p>}
                  <p><strong>Payment method:</strong> {transaction.paymentMethod || "Previously recorded"}</p>
                  <p><strong>Payment status:</strong> {transaction.paymentStatus}</p>
                  <p><strong>Order date:</strong> {transaction.date}</p>

                  {isFarmer && transaction.status === "Order Received" && (
                    <Button onClick={() => updateTransaction(transaction.id, { status: "Order Accepted", note: "Farmer accepted the order. Payment remains separate and pending." })}>Accept order</Button>
                  )}
                  {isFarmer && transaction.status === "Order Accepted" && (
                    <Button onClick={() => updateTransaction(transaction.id, { status: "Pickup Scheduled", note: "Pickup slot confirmed; GPS tracking is shown only when device location is available." })}>Schedule pickup</Button>
                  )}
                  {isFarmer && transaction.status === "Pickup Scheduled" && (
                    <Button onClick={() => updateTransaction(transaction.id, { status: "Collected", note: "Crop collected at pickup point; delivery has not yet been completed." })}>Confirm crop collected</Button>
                  )}
                  {isFarmer && transaction.status === "Collected" && (
                    <Button onClick={() => updateTransaction(transaction.id, { status: "In Transit", note: "Delivery journey started. GPS route link is available when both endpoints are captured." })}>Start delivery / in transit</Button>
                  )}
                  {isFarmer && transaction.status === "In Transit" && (
                    <Button onClick={() => updateTransaction(transaction.id, { status: "Delivered", paymentStatus: isCOD ? "COD due at delivery" : (transaction.paymentStatus || "Payment Pending"), note: "Delivery marked. Payment is not automatically completed by this action." })}>Confirm delivery</Button>
                  )}
                  {isCOD && isPendingCOD && isFarmer && transaction.status === "Delivered" && (
                    <Button onClick={() => confirmCashReceived(transaction)}>Confirm cash actually received</Button>
                  )}
                  {isCOD && isPendingCOD && isBuyer && (
                    <div className="transaction-assurance"><strong>Cash on delivery</strong><p>Pay only after checking the crop and agreed quantity. The farmer can record cash collection only after actually receiving the cash.</p></div>
                  )}
                  {!isCOD && ["Payment Pending", "Payment Initiated (demo)"].includes(transaction.paymentStatus) && isBuyer && (
                    <Button onClick={() => updateTransaction(transaction.id, { paymentStatus: "Payment Verification Requested", paymentVerificationRequested: true, note: "Buyer requested payment verification. No money movement or payment confirmation has occurred in this prototype." })}>I have paid — request verification</Button>
                  )}
                  {!isCOD && transaction.paymentStatus === "Payment Verification Requested" && (
                    <div className="transaction-assurance"><strong>Awaiting verified payment</strong><p>Payment is not marked successful. A real payment gateway/webhook or verified bank reconciliation is required before displaying Payment Received.</p></div>
                  )}
                  {transaction.status === "Delivered" && !isCOD && transaction.paymentStatus !== "Payment Received" && (
                    <div className="transaction-assurance"><strong>Delivered · payment pending verification</strong><p>Delivery status and payment status are separate. Updating delivery cannot complete a payment.</p></div>
                  )}
                  {transaction.status === "Completed" && transaction.paymentStatus === "Cash Collected" && (
                    <div className="success-box">Cash collection confirmed by farmer after delivery.</div>
                  )}
                  {(transaction.buyerGpsCoordinates || transaction.farmerGpsCoordinates) && (
                    <div className="transaction-location-panel">
                      <h4>📍 Pickup / delivery location</h4>
                      <div className="location-pair">
                        <span><strong>Farmer:</strong> {transaction.farmerLocationText || "GPS captured at listing"}</span>
                        <span><strong>Buyer:</strong> {transaction.buyerLocationText || "GPS captured at order"}</span>
                      </div>
                      {(transaction.buyerGpsCoordinates || transaction.farmerGpsCoordinates) && <a className="map-open-link" href={`https://www.google.com/maps/dir/${transaction.farmerGpsCoordinates?.latitude ?? transaction.farmerGpsCoordinates?.lat ?? ""},${transaction.farmerGpsCoordinates?.longitude ?? transaction.farmerGpsCoordinates?.lng ?? ""}/${transaction.buyerGpsCoordinates?.latitude ?? ""},${transaction.buyerGpsCoordinates?.longitude ?? ""}`} target="_blank" rel="noreferrer">Open pickup-to-buyer route map ↗</a>}
                    </div>
                  )}
                  {(transaction.timeline || []).length > 0 && (
                    <div className="transaction-history-list"><h4>Order & payment timeline</h4>{[...(transaction.timeline || [])].slice().reverse().map((event, index) => <div className="transaction-history-event" key={`${transaction.id}-event-${index}`}><strong>{event.status || "Payment update"}</strong><span>{event.paymentStatus || ""}</span><small>{event.note || "Status update"} · {new Date(event.at).toLocaleString()}</small></div>)}</div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
        <Button className="secondary" onClick={() => navigate(getDashboard())}>← Back to dashboard</Button>
      </Layout>
    );
  }

  /* =======================================================
     ORDER TRACKING
  ======================================================= */

  if (page === "orders") {
    const flow = [
      "Order Received",
      "Order Accepted",
      "Pickup Scheduled",
      "Collected",
      "In Transit",
      "Delivered",
      "Payment Completed",
    ];

    function updateOrder() {
      const index = flow.indexOf(orderStatus);

      const next =
        flow[
          Math.min(
            index + 1,
            flow.length - 1
          )
        ];

      setOrderStatus(next);

      if (next === "In Transit") {
        setTrackingProgress(60);
      }

      if (next === "Delivered") {
        setTrackingProgress(100);
      }
    }

    return (
      <Layout
        {...layoutProps}
        title="📦 Order Tracking"
      >
        <Card className="order-tracking-card">
          <div className="order-tracking-header"><span className="dashboard-eyebrow">ORDER TIMELINE</span><h2>{orderStatus}</h2><p>Track each milestone from order acceptance to payment completion.</p></div>
          <div className="progress">
            {flow.map((item) => (
              <p
                key={item}
                className={
                  item === orderStatus
                    ? "active-step"
                    : ""
                }
              >
                {item}
              </p>
            ))}
          </div>

          {orderStatus !==
            "Payment Completed" && (
            <Button onClick={updateOrder}>
              Update Order Status
            </Button>
          )}

          <div className="transaction-assurance"><strong>Live integration status</strong><p>Timeline updates are local demo state. Courier GPS, buyer notifications and real payment confirmation require connected services.</p></div>
        </Card>
      </Layout>
    );
  }

  /* =======================================================
     LOGIN HISTORY
  ======================================================= */

  if (page === "login-history") {
    return (
      <Layout
        {...layoutProps}
        title="📜 Login History"
      >
        <Card>
          {loginHistory.length === 0 ? (
            <p>
              Login history for this session will
              appear here.
            </p>
          ) : (
            loginHistory.map((item, index) => (
              <div
                key={index}
                className="login-history-item"
              >
                <strong>{item.name}</strong>

                <span>{item.role}</span>

                <span>{item.time}</span>
              </div>
            ))
          )}
        </Card>
      </Layout>
    );
  }

  /* =======================================================
     OFFLINE MODE
  ======================================================= */

  if (page === "offline-support") {
    return (
      <Layout
        {...layoutProps}
        title="📡 Offline Support"
      >
        <Card>
          <h2>
            Current Mode:
            {online
              ? " Online"
              : " Offline"}
          </h2>

          <p>
            Previously loaded information remains
            available. Save field notes below; they are stored in this browser on this device.
            This prototype does not yet synchronize listings or orders to a server.
          </p>
          <TextArea label="Offline field notes / unsent draft" value={farmNotes} onChange={(e) => { setFarmNotes(e.target.value); try { localStorage.setItem("aiFarmingOfflineNotes", e.target.value); } catch {} }} placeholder="Crop observations, planned tasks, buyer questions..." />
          <div className="success-box">{farmNotes ? "Draft saved locally in this browser." : "No offline note saved yet."}</div>

          <Button
            onClick={() =>
              setOnline(
                (previous) => !previous
              )
            }
          >
            {online
              ? "Simulate Offline Mode"
              : "Restore Internet"}
          </Button>
        </Card>
      </Layout>
    );
  }

  /* =======================================================
     PROFILE
  ======================================================= */

  if (page === "profile") {
    return (
      <Layout
        {...layoutProps}
        title="👤 Profile"
      >
        <Card>
          <h2>{userName}</h2>

          <p>Role: {role}</p>

          <p>Contact: {contact}</p>

          <p>
            Language:
            {language}
          </p>

          <Button
            className="danger"
            onClick={logout}
          >
            🚪 {t.logout}
          </Button>
        </Card>
      </Layout>
    );
  }

  /* =======================================================
     FALLBACK
  ======================================================= */

  return (
    <Layout
      {...layoutProps}
      title="Page Not Found"
    >
      <Card>
        <p>The requested page was not found.</p>

        <Button onClick={goDashboard}>
          Go to Dashboard
        </Button>
      </Card>
    </Layout>
  );
}

export default App;