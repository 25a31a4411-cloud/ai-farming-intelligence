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
    amount: 48000,
    status: "Completed",
    paymentStatus: "Payment Received",
    date: "2026-08-20",
  },
];

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

  const [online, setOnline] = useState(true);

  const [lots, setLots] = useState(initialLots);
  const [selectedLot, setSelectedLot] = useState(null);

  const [customers] = useState(initialCustomers);
  const [transactions, setTransactions] = useState(initialTransactions);

  const [loginHistory, setLoginHistory] = useState([]);

  const [cropForm, setCropForm] = useState({
    crop: "",
    quantity: "",
    location: "",
    harvest: "",
    quality: "A Grade",
    price: "",
    image: "",
    aiGrade: "",
  });

  const [editingLotId, setEditingLotId] = useState(null);

  const [requirement, setRequirement] = useState({
    crop: "Tomato",
    quantity: "10000",
    location: "Kakinada",
    date: "2026-09-15",
    quality: "A Grade",
  });

  const [requirementEditing, setRequirementEditing] = useState(true);

  const [confirmedIds, setConfirmedIds] = useState([]);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);

  const [marketUpdated, setMarketUpdated] = useState(false);

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

  /* =======================================================
     SESSION RESTORE
  ======================================================= */

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

  const estimatedNetReturn =
    sellingValue -
    transportationCost -
    storageCost -
    handlingCost;

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
    function enterApplication() {
      if (
        !userName.trim() ||
        !contact.trim() ||
        !password.trim()
      ) {
        alert("Please complete all required details.");
        return;
      }

      const now = new Date().toLocaleString();

      const newLogin = {
        name: userName,
        role,
        time: now,
      };

      setLoginHistory((previous) => [
        newLogin,
        ...previous,
      ]);

      localStorage.setItem(
        "aiFarmingSession",
        JSON.stringify({
          language,
          role,
          userName,
          contact,
        })
      );

      setLoggedIn(true);
      setHistory([]);
      setPage(getDashboard());
    }

    return (
      <Layout
        {...layoutProps}
        title={t.login}
        showNavigation={false}
      >
        <Card className="form-card">
          <Input
            label={t.name}
            value={userName}
            onChange={(e) =>
              setUserName(e.target.value)
            }
          />

          <VoiceInput
            language={language}
            buttonText={t.voiceInput}
            onResult={setUserName}
          />

          <Input
            label={t.contact}
            value={contact}
            onChange={(e) =>
              setContact(e.target.value)
            }
          />

          <Input
            label={t.password}
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <p>
            Selected Role: <strong>{role}</strong>
          </p>

          <Button onClick={enterApplication}>
            {t.enterApplication}
          </Button>
        </Card>
      </Layout>
    );
  }

  /* =======================================================
     FARMER DASHBOARD
  ======================================================= */

  if (page === "farmer-dashboard") {
    const items = [
      ["➕", "Add Crop", "crop-listing"],
      ["📦", "My Crop Lots", "my-crops"],
      ["📊", "Market Intelligence", "market-intelligence"],
      ["🤖", "AI Recommendations", "recommendations"],
      ["💰", "Net Return Intelligence", "net-return"],
      ["📈", "Future Crop Prediction", "future-prediction"],
      ["🏪", "Storage Feasibility", "storage-feasibility"],
      ["⚠️", "Transaction Risk", "risk-intelligence"],
      ["👥", "Customer History", "customer-history"],
      ["🤝", "Buyer Offers", "buyer-offers"],
      ["🚛", "Logistics & Live Tracking", "logistics"],
      ["💳", "Transactions", "payments"],
      ["📦", "Orders", "orders"],
      ["📜", "Login History", "login-history"],
      ["📡", "Offline Mode", "offline-support"],
      ["👤", "Profile", "profile"],
    ];

    return (
      <Layout
        {...layoutProps}
        title={`👨‍🌾 ${t.farmer} ${t.dashboard}`}
        showNavigation={false}
      >
        <div className="grid three">
          {items.map(([icon, label, target]) => (
            <Card key={target}>
              <h2>{icon}</h2>
              <h3>{label}</h3>

              <Button onClick={() => navigate(target)}>
                Open
              </Button>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  /* =======================================================
     CROP LISTING / EDIT
  ======================================================= */

  if (page === "crop-listing") {
    function handleImage(e) {
      const file = e.target.files?.[0];

      if (!file) return;

      const reader = new FileReader();

      reader.onloadend = () => {
        setCropForm((previous) => ({
          ...previous,
          image: reader.result,
        }));
      };

      reader.readAsDataURL(file);
    }

    async function startCamera() {
      try {
        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
          });

        streamRef.current = stream;

        setCameraOpen(true);

        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 100);
      } catch {
        alert("Camera permission was not available.");
      }
    }

    function stopCamera() {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      setCameraOpen(false);
    }

    function capturePhoto() {
      if (!videoRef.current) return;

      const canvas = document.createElement("canvas");

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      const context = canvas.getContext("2d");

      context.drawImage(
        videoRef.current,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const image = canvas.toDataURL("image/png");

      setCropForm((previous) => ({
        ...previous,
        image,
      }));

      stopCamera();
    }

    function analyzeQuality() {
      if (!cropForm.image) {
        alert("Please upload or capture a crop image first.");
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
        !cropForm.price
      ) {
        alert("Please fill all required crop details.");
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
        aiGrade: "",
      });

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

          <Input
            label={t.location}
            value={cropForm.location}
            onChange={(e) =>
              setCropForm((previous) => ({
                ...previous,
                location: e.target.value,
              }))
            }
          />

          <VoiceInput
            language={language}
            buttonText={t.voiceInput}
            onResult={(text) =>
              setCropForm((previous) => ({
                ...previous,
                location: text,
              }))
            }
          />

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

          <div className="quality-guidance">
            <strong>📷 AI Quality Capture Guidance</strong>
            <p>
              For better crop-quality analysis, capture:
              Front View, Top View and Side View.
            </p>
          </div>

          <Input
            label="Upload Crop Image"
            type="file"
            accept="image/*"
            onChange={handleImage}
          />

          <Button
            className="secondary"
            onClick={startCamera}
          >
            📷 Open Live Camera
          </Button>

          {cameraOpen && (
            <div className="camera-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
              />

              <div className="camera-actions">
                <Button onClick={capturePhoto}>
                  Capture
                </Button>

                <Button
                  className="danger"
                  onClick={stopCamera}
                >
                  Close Camera
                </Button>
              </div>
            </div>
          )}

          {cropForm.image && (
            <img
              src={cropForm.image}
              alt="Crop preview"
              className="image-preview"
            />
          )}

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

              <p>
                Prototype analysis confirms the
                selected grade based on available
                image information.
              </p>
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

                {lot.image && (
                  <img
                    src={lot.image}
                    alt={lot.crop}
                    className="crop-image-preview"
                  />
                )}

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
                      aiGrade: lot.aiGrade || "",
                    });

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
                Transportation Cost: ₹
                {transportationCost}
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
                Explainable AI calculates net return
                using quantity, price,
                transportation, storage and handling
                costs.
              </div>

              <AIVoiceExplanation
                language={language}
                text={`Estimated net return is ${estimatedNetReturn} rupees after calculating selling value and expected transportation, storage and handling costs.`}
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
    return (
      <Layout
        {...layoutProps}
        title="🏪 Storage Feasibility Intelligence"
      >
        <Card>
          <div className="score">
            {storageFeasibility.score}/100
          </div>

          <h2>
            Status: {storageFeasibility.status}
          </h2>

          <p>
            {storageFeasibility.recommendation}
          </p>

          <div className="warning">
            AI considers market threshold,
            expected price, crop information
            and storage cost.
          </div>

          <AIVoiceExplanation
            language={language}
            text={storageFeasibility.recommendation}
          />
        </Card>

        <h2>Nearby Storage Centers</h2>

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
     BUYER OFFERS
  ======================================================= */

  if (page === "buyer-offers") {
    return (
      <Layout
        {...layoutProps}
        title="🤝 Buyer Offers & Confirmation"
      >
        <Card>
          <h2>Incoming Buyer Offer</h2>

          <Input
            label="Offered Amount"
            type="number"
            value={buyerOffer.amount}
            onChange={(e) =>
              setBuyerOffer((previous) => ({
                ...previous,
                amount: e.target.value,
              }))
            }
          />

          <Input
            label="Requested Quantity"
            type="number"
            value={buyerOffer.quantity}
            onChange={(e) =>
              setBuyerOffer((previous) => ({
                ...previous,
                quantity: e.target.value,
              }))
            }
          />

          <Input
            label="Buyer Delivery Location"
            value={buyerOffer.deliveryLocation}
            onChange={(e) =>
              setBuyerOffer((previous) => ({
                ...previous,
                deliveryLocation: e.target.value,
              }))
            }
          />

          <Button
            onClick={() => {
              if (!buyerOffer.amount) {
                alert("Enter offer details.");
                return;
              }

              alert(
                "Buyer offer confirmed. Transaction can now proceed."
              );
            }}
          >
            Confirm Offer
          </Button>
        </Card>
      </Layout>
    );
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

          <h3>
            Estimated Transportation Cost:
            ₹{logisticsCost}
          </h3>
        </Card>

        <Card className="tracking-box">
          <h2>📍 Live Crop Load Tracking</h2>

          <p>
            Prototype location status:
            Crop is moving from Farmer →
            Buyer.
          </p>

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
      ["💳", "Transaction Process", "payments"],
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
                label={t.deliveryLocation}
                value={requirement.location}
                onChange={(e) =>
                  setRequirement((previous) => ({
                    ...previous,
                    location: e.target.value,
                  }))
                }
              />

              <VoiceInput
                language={language}
                buttonText={t.voiceInput}
                onResult={(text) =>
                  setRequirement((previous) => ({
                    ...previous,
                    location: text,
                  }))
                }
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
                onClick={() =>
                  setRequirementEditing(false)
                }
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
    function startTransaction() {
      if (
        !transactionDetails.buyerName.trim() ||
        !transactionDetails.phone.trim() ||
        !transactionDetails.address.trim() ||
        !transactionDetails.paymentMethod
      ) {
        alert(
          "Please complete all mandatory transaction details."
        );

        return;
      }

      setPaymentStatus("Payment Initiated");
      setOrderStatus("Order Accepted");

      navigate("payments");
    }

    return (
      <Layout
        {...layoutProps}
        title="💳 Professional Transaction Details"
      >
        <Card className="form-card">
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

          <p>
            Total Amount:
            ₹{buyerOffer.amount}
          </p>

          <Input
            label="Buyer / Organization Name"
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
            label="Phone Number"
            value={transactionDetails.phone}
            onChange={(e) =>
              setTransactionDetails(
                (previous) => ({
                  ...previous,
                  phone: e.target.value,
                })
              )
            }
          />

          <TextArea
            label="Delivery Address"
            value={transactionDetails.address}
            onChange={(e) =>
              setTransactionDetails(
                (previous) => ({
                  ...previous,
                  address: e.target.value,
                })
              )
            }
          />

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
            <option>Cash on Delivery</option>
          </Select>

          <Button onClick={startTransaction}>
            Proceed with Transaction
          </Button>
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
     PAYMENTS
  ======================================================= */

  if (page === "payments") {
    function updatePayment() {
      const nextStatus =
        paymentStatus === "Payment Pending"
          ? "Payment Initiated"
          : paymentStatus ===
            "Payment Initiated"
          ? "Verification"
          : "Payment Received";

      setPaymentStatus(nextStatus);

      if (nextStatus === "Payment Received") {
        setTransactions((previous) => [
          {
            id: `TXN-${Date.now()}`,
            customer:
              transactionDetails.buyerName ||
              "New Buyer",
            amount:
              Number(buyerOffer.amount) ||
              sellingValue ||
              25000,
            status: "Completed",
            paymentStatus:
              "Payment Received",
            date: new Date()
              .toISOString()
              .split("T")[0],
          },
          ...previous,
        ]);
      }
    }

    return (
      <Layout
        {...layoutProps}
        title="💳 Payment & Transaction Tracking"
      >
        <Card>
          <h2>{paymentStatus}</h2>

          <p>
            Transaction status can be viewed by
            both buyer and farmer.
          </p>

          {paymentStatus !==
            "Payment Received" && (
            <Button onClick={updatePayment}>
              Update Transaction Status
            </Button>
          )}

          {paymentStatus ===
            "Payment Received" && (
            <div className="success-box">
              Payment successfully received and
              transaction recorded.
            </div>
          )}
        </Card>

        <h2>Transaction History</h2>

        <div className="grid">
          {transactions.map((transaction) => (
            <Card
              key={transaction.id}
              className="transaction-card"
            >
              <h3>{transaction.id}</h3>

              <p>
                Customer:
                {transaction.customer}
              </p>

              <p>
                Amount:
                ₹{transaction.amount}
              </p>

              <p>
                Status:
                {transaction.status}
              </p>

              <p>
                Payment:
                {transaction.paymentStatus}
              </p>

              <p>
                Date:
                {transaction.date}
              </p>
            </Card>
          ))}
        </div>
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
        <Card>
          <h2>{orderStatus}</h2>

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

          <p>
            Farmer updates order progress and
            buyer can see the latest status.
          </p>
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
            available. Prototype actions can be
            synchronized when connectivity returns.
          </p>

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