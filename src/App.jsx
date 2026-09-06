import { useEffect, useMemo, useState } from "react";
import "./App.css";

/* ==================================================
   LANGUAGE TRANSLATIONS
================================================== */

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
    farmer: "Farmer",
    buyer: "Buyer",
    fpo: "FPO / Cooperative",
    online: "Online",
    offline: "Offline",
    continue: "Continue",
    name: "Name",
    mobile: "Mobile / Email",
    password: "Password",
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
    farmer: "రైతు",
    buyer: "కొనుగోలుదారు",
    fpo: "ఎఫ్‌పీఓ / సహకార సంఘం",
    online: "ఆన్‌లైన్",
    offline: "ఆఫ్‌లైన్",
    continue: "కొనసాగించండి",
    name: "పేరు",
    mobile: "మొబైల్ / ఇమెయిల్",
    password: "పాస్‌వర్డ్",
  },
};

/* ==================================================
   INITIAL DEMO DATA
================================================== */

const initialLots = [
  {
    id: 1,
    crop: "Tomato",
    quantity: 2000,
    location: "Kakinada",
    harvest: "2026-09-08",
    quality: "A Grade",
    price: 24,
    farmer: "Farmer A",
    ownerId: "demo-farmer-a",
    status: "Available",
  },
  {
    id: 2,
    crop: "Tomato",
    quantity: 3000,
    location: "Pithapuram",
    harvest: "2026-09-09",
    quality: "A Grade",
    price: 23,
    farmer: "Farmer B",
    ownerId: "demo-farmer-b",
    status: "Available",
  },
  {
    id: 3,
    crop: "Tomato",
    quantity: 5000,
    location: "Samalkota",
    harvest: "2026-09-10",
    quality: "A Grade",
    price: 25,
    farmer: "Farmer C",
    ownerId: "demo-farmer-c",
    status: "Available",
  },
  {
    id: 4,
    crop: "Chilli",
    quantity: 2500,
    location: "Guntur",
    harvest: "2026-10-02",
    quality: "A Grade",
    price: 48,
    farmer: "Farmer D",
    ownerId: "demo-farmer-d",
    status: "Available",
  },
];

const buyerHistoryData = [
  {
    id: 1,
    buyer: "FreshMart Traders",
    totalOrders: 12,
    successfulTransactions: 11,
    disputes: 0,
    reliability: 96,
    status: "Highly Reliable",
  },
  {
    id: 2,
    buyer: "Green Foods Pvt Ltd",
    totalOrders: 8,
    successfulTransactions: 7,
    disputes: 1,
    reliability: 82,
    status: "Reliable",
  },
  {
    id: 3,
    buyer: "Quick Agro Market",
    totalOrders: 4,
    successfulTransactions: 2,
    disputes: 2,
    reliability: 50,
    status: "Medium Risk",
  },
];

const futureCropData = [
  {
    crop: "Chilli",
    seasonalDemand: 92,
    buyerDemand: 88,
    priceTrend: 85,
    profitPotential: 90,
    logisticsScore: 82,
  },
  {
    crop: "Tomato",
    seasonalDemand: 78,
    buyerDemand: 90,
    priceTrend: 72,
    profitPotential: 74,
    logisticsScore: 88,
  },
  {
    crop: "Maize",
    seasonalDemand: 84,
    buyerDemand: 76,
    priceTrend: 82,
    profitPotential: 80,
    logisticsScore: 86,
  },
  {
    crop: "Groundnut",
    seasonalDemand: 81,
    buyerDemand: 79,
    priceTrend: 84,
    profitPotential: 86,
    logisticsScore: 75,
  },
];

/* ==================================================
   REUSABLE COMPONENTS
   IMPORTANT: OUTSIDE APP()
================================================== */

function Button({
  children,
  onClick,
  className = "",
  type = "button",
  disabled = false,
}) {
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
}

function Card({ children, className = "" }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function Input({ label, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select {...props}>{children}</select>
    </label>
  );
}

function Layout({
  title,
  children,
  loggedIn,
  userName,
  role,
  online,
  t,
  historyLength,
  onBack,
  onDashboard,
  showNavigation = true,
}) {
  return (
    <main className="app">
      {loggedIn && (
        <header className="topbar">
          <div>
            <h2>🌾 {t.appName}</h2>

            <small>
              {userName} • {role}
            </small>
          </div>

          <div className="top-info">
            <span className={online ? "online" : "offline"}>
              ● {online ? t.online : t.offline}
            </span>

            <Button className="secondary" onClick={onDashboard}>
              🏠 {t.dashboard}
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
            ← {t.back}
          </Button>

          <Button onClick={onDashboard}>
            🏠 {t.dashboard}
          </Button>
        </footer>
      )}
    </main>
  );
}

/* ==================================================
   MAIN APPLICATION
================================================== */

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

  const [selectedBuyer, setSelectedBuyer] = useState(null);

  const [cropForm, setCropForm] = useState({
    crop: "",
    quantity: "",
    location: "",
    harvest: "",
    quality: "A Grade",
    price: "",
  });

  const [requirement, setRequirement] = useState({
    crop: "Tomato",
    quantity: 10000,
    location: "Kakinada",
    date: "2026-09-15",
    quality: "A Grade",
  });

  const [confirmedIds, setConfirmedIds] = useState([]);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);

  const [marketUpdated, setMarketUpdated] = useState(false);

  const [deliveryMode, setDeliveryMode] = useState("Buyer Pickup");

  const [paymentStatus, setPaymentStatus] =
    useState("Payment Pending");

  const [orderStatus, setOrderStatus] =
    useState("Order Received");

  const [dispute, setDispute] = useState("");

  const [transactions, setTransactions] = useState([
    {
      id: 1,
      crop: "Tomato",
      buyer: "FreshMart Traders",
      amount: 48000,
      status: "Successful",
      date: "2026-08-28",
      reliability: 96,
    },
  ]);

  const t = translations[language];

  /* ==================================================
     SESSION RESTORE
  ================================================== */

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

  /* ==================================================
     NAVIGATION
  ================================================== */

  function navigate(nextPage) {
    setHistory((oldHistory) => [...oldHistory, page]);
    setPage(nextPage);
  }

  function goBack() {
    setHistory((oldHistory) => {
      if (oldHistory.length === 0) return oldHistory;

      const newHistory = [...oldHistory];
      const previousPage = newHistory.pop();

      setPage(previousPage);
      return newHistory;
    });
  }

  function getDashboard() {
    if (role === "Farmer") return "farmer-dashboard";
    if (role === "Buyer") return "buyer-dashboard";
    if (role === "FPO") return "fpo-dashboard";

    return "splash";
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
    setHistory([]);
    setPage("splash");
  }

  function protectedNavigate(target) {
    navigate(target);
  }

  /* ==================================================
     USER LOTS
  ================================================== */

  const myLots = useMemo(() => {
    return lots.filter((lot) => lot.ownerId === contact);
  }, [lots, contact]);

  /* ==================================================
     BUYER MATCHING
  ================================================== */

  const matches = useMemo(() => {
    return lots.filter((lot) => {
      const cropMatch =
        lot.crop.toLowerCase() ===
        String(requirement.crop).toLowerCase().trim();

      const qualityMatch =
        requirement.quality === "Any Quality" ||
        lot.quality === requirement.quality;

      return cropMatch && qualityMatch && lot.status === "Available";
    });
  }, [lots, requirement]);

  const totalSupply = useMemo(() => {
    return matches.reduce(
      (total, lot) => total + Number(lot.quantity),
      0
    );
  }, [matches]);

  const confirmedLots = useMemo(() => {
    return lots.filter((lot) => confirmedIds.includes(lot.id));
  }, [lots, confirmedIds]);

  const confirmedQuantity = useMemo(() => {
    return confirmedLots.reduce(
      (total, lot) => total + Number(lot.quantity),
      0
    );
  }, [confirmedLots]);

  const remainingQuantity = Math.max(
    0,
    Number(requirement.quantity) - confirmedQuantity
  );

  /* ==================================================
     FARMER INTELLIGENCE
  ================================================== */

  const farmerActiveLot =
    selectedLot && selectedLot.ownerId === contact
      ? selectedLot
      : myLots[0] || null;

  const grossValue =
    Number(farmerActiveLot?.quantity || 0) *
    Number(farmerActiveLot?.price || 0);

  const estimatedDistance =
    selectedBuyer?.buyer === "FreshMart Traders"
      ? 28
      : selectedBuyer?.buyer === "Green Foods Pvt Ltd"
      ? 42
      : selectedBuyer?.buyer === "Quick Agro Market"
      ? 65
      : 30;

  const transportationCost = Math.round(
    Number(farmerActiveLot?.quantity || 0) *
      estimatedDistance *
      0.025
  );

  const storageCost = Math.round(
    Number(farmerActiveLot?.quantity || 0) * 0.35
  );

  const handlingCost = Math.round(
    Number(farmerActiveLot?.quantity || 0) * 0.2
  );

  const estimatedNetReturn =
    grossValue -
    transportationCost -
    storageCost -
    handlingCost;

  const storageFeasible =
    farmerActiveLot &&
    farmerActiveLot.quantity > 0 &&
    storageCost < grossValue * 0.1;

  const riskScore = useMemo(() => {
    if (!farmerActiveLot) return 0;

    let risk = 15;

    if (farmerActiveLot.quality !== "A Grade") {
      risk += 15;
    }

    if (estimatedDistance > 50) {
      risk += 20;
    }

    if (marketUpdated) {
      risk -= 5;
    }

    if (selectedBuyer && selectedBuyer.reliability < 70) {
      risk += 30;
    }

    return Math.max(0, Math.min(100, risk));
  }, [
    farmerActiveLot,
    estimatedDistance,
    marketUpdated,
    selectedBuyer,
  ]);

  const opportunityScore = useMemo(() => {
    if (!farmerActiveLot) return 0;

    let score = 45;

    if (farmerActiveLot.quality === "A Grade") score += 15;
    if (farmerActiveLot.quantity >= 1000) score += 10;
    if (farmerActiveLot.price >= 20) score += 10;
    if (marketUpdated) score += 5;

    score -= Math.round(riskScore * 0.1);

    return Math.max(0, Math.min(100, Math.round(score)));
  }, [farmerActiveLot, marketUpdated, riskScore]);

  /* ==================================================
     FUTURE CROP PREDICTION
  ================================================== */

  const futurePredictions = useMemo(() => {
    return futureCropData
      .map((item) => {
        const score = Math.round(
          item.seasonalDemand * 0.25 +
            item.buyerDemand * 0.3 +
            item.priceTrend * 0.2 +
            item.profitPotential * 0.15 +
            item.logisticsScore * 0.1
        );

        return {
          ...item,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, []);

  /* ==================================================
     TRANSACTION RISK
  ================================================== */

  const selectedBuyerRisk = selectedBuyer
    ? 100 - selectedBuyer.reliability
    : 20;

  const transactionRecommendation =
    selectedBuyerRisk <= 15
      ? "Safe to proceed with normal verification."
      : selectedBuyerRisk <= 35
      ? "Proceed with additional payment and order verification."
      : "High risk detected. Use secure verification before confirming.";

  /* ==================================================
     LAYOUT PROPS
  ================================================== */

  const layoutProps = {
    loggedIn,
    userName,
    role,
    online,
    t,
    historyLength: history.length,
    onBack: goBack,
    onDashboard: goDashboard,
  };

  /* ==================================================
     SPLASH
  ================================================== */

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

  /* ==================================================
     LANGUAGE
  ================================================== */

  if (page === "language") {
    return (
      <Layout
        {...layoutProps}
        title={t.chooseLanguage}
        showNavigation={false}
      >
        <div className="grid two">
          <Card className={language === "English" ? "selected" : ""}>
            <h2>English</h2>
            <Button onClick={() => setLanguage("English")}>
              Select English
            </Button>
          </Card>

          <Card className={language === "Telugu" ? "selected" : ""}>
            <h2>తెలుగు</h2>
            <Button onClick={() => setLanguage("Telugu")}>
              తెలుగు ఎంచుకోండి
            </Button>
          </Card>
        </div>

        <Button onClick={() => navigate("role")}>
          {t.continue} →
        </Button>
      </Layout>
    );
  }

  /* ==================================================
     ROLE
  ================================================== */

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
              className={role === value ? "selected" : ""}
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

  /* ==================================================
     LOGIN
  ================================================== */

  if (page === "login") {
    function enterApplication() {
      if (
        !userName.trim() ||
        !contact.trim() ||
        !password.trim() ||
        !role
      ) {
        alert("Please complete all login details.");
        return;
      }

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

      if (role === "Farmer") setPage("farmer-dashboard");
      if (role === "Buyer") setPage("buyer-dashboard");
      if (role === "FPO") setPage("fpo-dashboard");
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
            placeholder="Enter your name"
            onChange={(e) => setUserName(e.target.value)}
          />

          <Input
            label={t.mobile}
            value={contact}
            placeholder="Enter mobile number or email"
            onChange={(e) => setContact(e.target.value)}
          />

          <Input
            label={t.password}
            type="password"
            value={password}
            placeholder="Enter password"
            onChange={(e) => setPassword(e.target.value)}
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

  /* ==================================================
     FARMER DASHBOARD
  ================================================== */

  if (page === "farmer-dashboard") {
    const items = [
      ["➕", "Add Crop", "crop-listing"],
      ["📦", "My Crop Lots", "my-crops"],
      ["📷", "Crop Quality", "crop-quality"],
      ["📊", "Market Intelligence", "market-intelligence"],
      ["🤖", "AI Recommendations", "recommendations"],
      ["💰", "Net Return Intelligence", "net-return"],
      ["🏪", "Storage Feasibility", "storage-feasibility"],
      ["🔮", "Future Crop Prediction", "future-crop"],
      ["👥", "Customer History", "customer-history"],
      ["⚠️", "Risk & Reliability", "risk-reliability"],
      ["🚛", "Logistics", "logistics"],
      ["💳", "Payments", "payments"],
      ["🧾", "Transactions", "transactions"],
      ["📦", "Orders", "orders"],
      ["👤", "Profile", "profile"],
    ];

    return (
      <Layout
        {...layoutProps}
        title="👨‍🌾 Farmer Dashboard"
        showNavigation={false}
      >
        <div className="grid three">
          {items.map(([icon, label, target]) => (
            <Card key={target}>
              <h2>{icon}</h2>
              <h3>{label}</h3>

              <Button
                onClick={() => protectedNavigate(target)}
              >
                Open
              </Button>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  /* ==================================================
     CROP LISTING
  ================================================== */

  if (page === "crop-listing") {
    function saveCrop() {
      if (
        !cropForm.crop ||
        !cropForm.quantity ||
        !cropForm.location ||
        !cropForm.price
      ) {
        alert("Please fill all required crop details.");
        return;
      }

      const newLot = {
        id: Date.now(),
        crop: cropForm.crop,
        quantity: Number(cropForm.quantity),
        location: cropForm.location,
        harvest: cropForm.harvest,
        quality: cropForm.quality,
        price: Number(cropForm.price),
        farmer: userName,
        ownerId: contact,
        status: "Available",
      };

      setLots((oldLots) => [...oldLots, newLot]);
      setSelectedLot(newLot);

      setCropForm({
        crop: "",
        quantity: "",
        location: "",
        harvest: "",
        quality: "A Grade",
        price: "",
      });

      alert("Crop listed successfully.");
      navigate("my-crops");
    }

    return (
      <Layout {...layoutProps} title="🌱 Smart Crop Listing">
        <Card className="form-card">
          <Input
            label="Crop Name"
            value={cropForm.crop}
            onChange={(e) =>
              setCropForm({
                ...cropForm,
                crop: e.target.value,
              })
            }
          />

          <Input
            label="Available Quantity (kg)"
            type="number"
            value={cropForm.quantity}
            onChange={(e) =>
              setCropForm({
                ...cropForm,
                quantity: e.target.value,
              })
            }
          />

          <Input
            label="Farm Location"
            value={cropForm.location}
            onChange={(e) =>
              setCropForm({
                ...cropForm,
                location: e.target.value,
              })
            }
          />

          <Input
            label="Harvest Date"
            type="date"
            value={cropForm.harvest}
            onChange={(e) =>
              setCropForm({
                ...cropForm,
                harvest: e.target.value,
              })
            }
          />

          <Select
            label="Quality"
            value={cropForm.quality}
            onChange={(e) =>
              setCropForm({
                ...cropForm,
                quality: e.target.value,
              })
            }
          >
            <option>A Grade</option>
            <option>B Grade</option>
            <option>Mixed Grade</option>
          </Select>

          <Input
            label="Expected Price per kg"
            type="number"
            value={cropForm.price}
            onChange={(e) =>
              setCropForm({
                ...cropForm,
                price: e.target.value,
              })
            }
          />

          <Button onClick={saveCrop}>Save Crop</Button>
        </Card>
      </Layout>
    );
  }

  /* ==================================================
     MY CROPS
  ================================================== */

  if (page === "my-crops") {
    return (
      <Layout {...layoutProps} title="📦 My Crop Lots">
        {myLots.length === 0 ? (
          <Card>
            <h3>No crops listed yet.</h3>

            <Button onClick={() => navigate("crop-listing")}>
              Add Your First Crop
            </Button>
          </Card>
        ) : (
          <div className="grid">
            {myLots.map((lot) => (
              <Card key={lot.id}>
                <h2>🌱 {lot.crop}</h2>
                <p>Quantity: {lot.quantity} kg</p>
                <p>Location: {lot.location}</p>
                <p>Quality: {lot.quality}</p>
                <p>Expected Price: ₹{lot.price}/kg</p>
                <p>Status: {lot.status}</p>

                <Button
                  onClick={() => {
                    setSelectedLot(lot);
                    navigate("crop-quality");
                  }}
                >
                  View Intelligence
                </Button>
              </Card>
            ))}
          </div>
        )}
      </Layout>
    );
  }

  /* ==================================================
     CROP QUALITY
  ================================================== */

  if (page === "crop-quality") {
    return (
      <Layout {...layoutProps} title="📷 Crop Quality Assessment">
        {!farmerActiveLot ? (
          <Card>
            <h3>Please select or add a crop first.</h3>
          </Card>
        ) : (
          <Card>
            <h2>{farmerActiveLot.crop}</h2>

            <Input
              label="Upload Crop Image"
              type="file"
              accept="image/*"
            />

            <h3>Prototype Assessment</h3>
            <p>Detected Quality: {farmerActiveLot.quality}</p>

            <div className="warning">
              Prototype demonstration. A production version can connect
              a trained computer-vision AI model.
            </div>
          </Card>
        )}
      </Layout>
    );
  }

  /* ==================================================
     MARKET INTELLIGENCE
  ================================================== */

  if (page === "market-intelligence") {
    return (
      <Layout {...layoutProps} title="📊 Market Intelligence">
        <div className="grid three">
          <Card>
            <h3>Current Market Price</h3>
            <h2>₹{marketUpdated ? 27 : 24}/kg</h2>
          </Card>

          <Card>
            <h3>Historical Trend</h3>
            <h2>{marketUpdated ? "📈 +12%" : "📈 +8%"}</h2>
          </Card>

          <Card>
            <h3>Buyer Demand</h3>
            <h2>{marketUpdated ? "High" : "Medium"}</h2>
          </Card>

          <Card>
            <h3>Seasonal Demand</h3>
            <h2>Growing</h2>
          </Card>

          <Card>
            <h3>Market Arrival Volume</h3>
            <h2>{marketUpdated ? "High" : "Medium"}</h2>
          </Card>
        </div>

        <Button onClick={() => setMarketUpdated((old) => !old)}>
          Simulate Market Update
        </Button>
      </Layout>
    );
  }

  /* ==================================================
     AI RECOMMENDATIONS + EXPLAINABLE AI
  ================================================== */

  if (page === "recommendations") {
    return (
      <Layout {...layoutProps} title="🤖 AI Recommendations">
        {!farmerActiveLot ? (
          <Card>
            <h3>Add a crop lot first.</h3>
          </Card>
        ) : (
          <>
            <Card>
              <div className="score">{opportunityScore}/100</div>

              <h3>Opportunity Score</h3>

              <p>
                The score considers crop quality, quantity, expected
                price, market conditions and transaction risk.
              </p>
            </Card>

            <div className="grid three">
              <Card className="selected">
                <h2>🥇 Sell Now</h2>
                <p>Estimated Net Return: ₹{estimatedNetReturn}</p>
                <p>Risk Score: {riskScore}/100</p>
              </Card>

              <Card>
                <h2>🥈 Wait</h2>
                <p>
                  Potential for better price, but market uncertainty
                  exists.
                </p>
              </Card>

              <Card>
                <h2>🥉 Store</h2>
                <p>
                  Storage Feasibility:{" "}
                  {storageFeasible ? "Suitable" : "Not Recommended"}
                </p>
                <p>Estimated Storage Cost: ₹{storageCost}</p>
              </Card>
            </div>

            <Card>
              <h2>🔍 Explainable AI</h2>

              <p>
                <strong>Why Sell Now?</strong>
              </p>

              <ul>
                <li>Current market demand is favorable.</li>
                <li>
                  Crop quality: {farmerActiveLot.quality}.
                </li>
                <li>
                  Estimated net return is ₹{estimatedNetReturn}.
                </li>
                <li>
                  Risk score is {riskScore}/100.
                </li>
                <li>
                  Storage feasibility is{" "}
                  {storageFeasible
                    ? "economically acceptable"
                    : "less favorable"}.
                </li>
              </ul>
            </Card>
          </>
        )}
      </Layout>
    );
  }

  /* ==================================================
     NET RETURN INTELLIGENCE
  ================================================== */

  if (page === "net-return") {
    return (
      <Layout {...layoutProps} title="💰 Net Return Intelligence">
        <Card>
          <p>Gross Crop Value: ₹{grossValue}</p>
          <p>Transportation Cost: ₹{transportationCost}</p>
          <p>Storage Cost Estimate: ₹{storageCost}</p>
          <p>Handling Cost: ₹{handlingCost}</p>

          <hr />

          <h2>Estimated Net Return: ₹{estimatedNetReturn}</h2>

          <div className="warning">
            Net return is calculated after estimated logistics,
            storage and handling costs.
          </div>
        </Card>
      </Layout>
    );
  }

  /* ==================================================
     STORAGE FEASIBILITY
  ================================================== */

  if (page === "storage-feasibility") {
    return (
      <Layout {...layoutProps} title="🏪 Storage Feasibility">
        <Card>
          <h2>
            {storageFeasible
              ? "✅ Storage is Feasible"
              : "⚠️ Storage is Not Economically Ideal"}
          </h2>

          <p>Estimated Storage Cost: ₹{storageCost}</p>

          <p>
            Storage analysis considers quantity, estimated storage
            cost and potential impact on net return.
          </p>
        </Card>
      </Layout>
    );
  }

  /* ==================================================
     FUTURE CROP PREDICTION
  ================================================== */

  if (page === "future-crop") {
    return (
      <Layout {...layoutProps} title="🔮 AI Future Crop Prediction">
        <Card>
          <h2>Recommended Future Crops</h2>

          <p>
            Prediction considers seasonal demand, buyer demand, price
            trend, profitability and logistics.
          </p>
        </Card>

        <div className="grid">
          {futurePredictions.map((crop, index) => (
            <Card
              key={crop.crop}
              className={index === 0 ? "selected" : ""}
            >
              <h2>
                #{index + 1} 🌱 {crop.crop}
              </h2>

              <p>AI Prediction Score: {crop.score}/100</p>
              <p>Seasonal Demand: {crop.seasonalDemand}/100</p>
              <p>Buyer Demand: {crop.buyerDemand}/100</p>
              <p>Price Trend: {crop.priceTrend}/100</p>
              <p>Profit Potential: {crop.profitPotential}/100</p>
              <p>Logistics Score: {crop.logisticsScore}/100</p>
            </Card>
          ))}
        </div>

        <Card>
          <h2>🔍 Explainable Prediction</h2>

          <p>
            The highest ranked crop receives its score from the
            combination of future seasonal demand, active buyer demand,
            expected price movement, profitability and logistics
            feasibility.
          </p>
        </Card>
      </Layout>
    );
  }

  /* ==================================================
     CUSTOMER HISTORY
  ================================================== */

  if (page === "customer-history") {
    return (
      <Layout {...layoutProps} title="👥 Customer / Buyer History">
        <div className="grid">
          {buyerHistoryData.map((buyer) => (
            <Card
              key={buyer.id}
              className={
                selectedBuyer?.id === buyer.id ? "selected" : ""
              }
            >
              <h2>{buyer.buyer}</h2>

              <p>Total Orders: {buyer.totalOrders}</p>
              <p>
                Successful Transactions:{" "}
                {buyer.successfulTransactions}
              </p>
              <p>Past Disputes: {buyer.disputes}</p>

              <h3>Reliability: {buyer.reliability}%</h3>
              <p>Status: {buyer.status}</p>

              <Button onClick={() => setSelectedBuyer(buyer)}>
                Select Buyer
              </Button>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  /* ==================================================
     RISK & RELIABILITY
  ================================================== */

  if (page === "risk-reliability") {
    return (
      <Layout
        {...layoutProps}
        title="🛡️ AI Transaction Risk & Reliability"
      >
        <Card>
          <h2>
            Selected Customer:{" "}
            {selectedBuyer?.buyer || "No customer selected"}
          </h2>

          <p>
            Customer Reliability:{" "}
            {selectedBuyer
              ? `${selectedBuyer.reliability}%`
              : "Not calculated"}
          </p>

          <p>
            Transaction Risk:{" "}
            {selectedBuyer
              ? `${selectedBuyerRisk}/100`
              : "Select a customer first"}
          </p>

          <p>
            Recommendation: {transactionRecommendation}
          </p>
        </Card>

        <Card>
          <h2>🔍 Explainable AI Risk Detection</h2>

          <ul>
            <li>Previous successful transactions are considered.</li>
            <li>Past disputes increase the risk level.</li>
            <li>Customer order history contributes to reliability.</li>
            <li>
              Higher transportation distance may increase transaction
              and logistics risk.
            </li>
          </ul>
        </Card>
      </Layout>
    );
  }

  /* ==================================================
     LOGISTICS
  ================================================== */

  if (page === "logistics" || page === "fpo-logistics") {
    return (
      <Layout {...layoutProps} title="🚛 Logistics & Delivery Intelligence">
        <Card>
          <h2>
            Delivery Location:{" "}
            {selectedBuyer?.buyer || requirement.location}
          </h2>

          <p>Estimated Distance: {estimatedDistance} km</p>

          <p>
            Estimated Transportation Charges: ₹
            {transportationCost}
          </p>

          <Select
            label="Delivery Responsibility"
            value={deliveryMode}
            onChange={(e) => setDeliveryMode(e.target.value)}
          >
            <option>Buyer Pickup</option>
            <option>Farmer Delivery</option>
            <option>Logistics Provider</option>
          </Select>

          <Card className="selected">
            <h3>Logistics Cost Intelligence</h3>

            <p>
              Transportation charges are estimated using crop quantity
              and delivery distance.
            </p>
          </Card>
        </Card>
      </Layout>
    );
  }

  /* ==================================================
     BUYER DASHBOARD
  ================================================== */

  if (page === "buyer-dashboard") {
    const items = [
      ["🛒", "Create Requirement", "buyer-requirement"],
      ["🔍", "Search Crops", "buyer-search"],
      ["💬", "Ask Farmer Questions", "buyer-inquiry"],
      ["🤖", "Dynamic Supply Matching", "supply-matching"],
      ["📦", "AI Supply Aggregation", "aggregation"],
      ["🚛", "Delivery & Logistics", "logistics"],
      ["🛡️", "Transaction Reliability", "risk-reliability"],
      ["💳", "Payments", "payments"],
      ["🧾", "Transaction History", "transactions"],
      ["📦", "Orders", "orders"],
      ["👤", "Profile", "profile"],
    ];

    return (
      <Layout
        {...layoutProps}
        title="🏢 Buyer Dashboard"
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

  /* ==================================================
     BUYER REQUIREMENT
  ================================================== */

  if (page === "buyer-requirement") {
    return (
      <Layout {...layoutProps} title="🛒 Create Buyer Requirement">
        <Card className="form-card">
          <Input
            label="Required Crop"
            value={requirement.crop}
            onChange={(e) =>
              setRequirement({
                ...requirement,
                crop: e.target.value,
              })
            }
          />

          <Input
            label="Required Quantity (kg)"
            type="number"
            value={requirement.quantity}
            onChange={(e) =>
              setRequirement({
                ...requirement,
                quantity: e.target.value,
              })
            }
          />

          <Input
            label="Customer Delivery Location"
            value={requirement.location}
            onChange={(e) =>
              setRequirement({
                ...requirement,
                location: e.target.value,
              })
            }
          />

          <Input
            label="Required Date"
            type="date"
            value={requirement.date}
            onChange={(e) =>
              setRequirement({
                ...requirement,
                date: e.target.value,
              })
            }
          />

          <Select
            label="Required Quality"
            value={requirement.quality}
            onChange={(e) =>
              setRequirement({
                ...requirement,
                quality: e.target.value,
              })
            }
          >
            <option>A Grade</option>
            <option>B Grade</option>
            <option>Any Quality</option>
          </Select>

          <Button onClick={() => navigate("buyer-search")}>
            Find Supply
          </Button>
        </Card>
      </Layout>
    );
  }

  /* ==================================================
     BUYER SEARCH
  ================================================== */

  if (page === "buyer-search") {
    return (
      <Layout {...layoutProps} title="🔍 Available Crop Supply">
        <Card>
          <h3>Compatible Lots Found: {matches.length}</h3>
        </Card>

        <div className="grid">
          {matches.map((lot) => (
            <Card key={lot.id}>
              <h2>🌱 {lot.crop}</h2>

              <p>Quantity: {lot.quantity} kg</p>
              <p>Farmer: {lot.farmer}</p>
              <p>Location: {lot.location}</p>
              <p>Quality: {lot.quality}</p>
              <p>Price: ₹{lot.price}/kg</p>

              <Button
                onClick={() => {
                  setSelectedLot(lot);
                  navigate("crop-details");
                }}
              >
                View Details
              </Button>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  /* ==================================================
     CROP DETAILS
  ================================================== */

  if (page === "crop-details") {
    return (
      <Layout {...layoutProps} title="🌱 Crop Details">
        {!selectedLot ? (
          <Card>
            <h3>Select a crop first.</h3>
          </Card>
        ) : (
          <Card>
            <h2>{selectedLot.crop}</h2>
            <p>Quantity: {selectedLot.quantity} kg</p>
            <p>Farmer: {selectedLot.farmer}</p>
            <p>Location: {selectedLot.location}</p>
            <p>Quality: {selectedLot.quality}</p>
            <p>Expected Price: ₹{selectedLot.price}/kg</p>

            <Button onClick={() => navigate("buyer-inquiry")}>
              Ask Farmer Questions
            </Button>
          </Card>
        )}
      </Layout>
    );
  }

  /* ==================================================
     BUYER INQUIRY
  ================================================== */

  if (page === "buyer-inquiry") {
    function sendQuestion() {
      if (!question.trim()) return;

      setMessages((oldMessages) => [
        ...oldMessages,
        {
          from: "Buyer",
          text: question,
        },
        {
          from: "System",
          text: `Question recorded for ${
            selectedLot?.farmer || "the farmer"
          }.`,
        },
      ]);

      setQuestion("");
    }

    return (
      <Layout {...layoutProps} title="💬 Buyer Questions to Farmer">
        <Card>
          <p>
            Ask optional additional questions about this crop, including
            harvesting, packing, quality or delivery.
          </p>

          <div className="messages">
            {messages.map((message, index) => (
              <p
                key={index}
                className={
                  message.from === "Buyer"
                    ? "buyer-msg"
                    : "ai-msg"
                }
              >
                <strong>{message.from}:</strong> {message.text}
              </p>
            ))}
          </div>

          <Input
            label="Ask Farmer"
            value={question}
            placeholder="Example: Can you arrange packing and delivery?"
            onChange={(e) => setQuestion(e.target.value)}
          />

          <Button onClick={sendQuestion}>
            Send Question
          </Button>

          <Button
            className="secondary"
            onClick={() => navigate("supply-matching")}
          >
            Continue to Supply Matching
          </Button>
        </Card>
      </Layout>
    );
  }

  /* ==================================================
     SUPPLY MATCHING
  ================================================== */

  if (page === "supply-matching") {
    return (
      <Layout {...layoutProps} title="🤖 Dynamic AI Supply Matching">
        <Card>
          <h3>Buyer Requirement</h3>

          <p>
            {requirement.quantity} kg {requirement.crop}
          </p>

          <p>Delivery Location: {requirement.location}</p>

          <hr />

          <h3>AI Compatible Supply</h3>

          {matches.map((lot) => (
            <p key={lot.id}>
              ✅ {lot.farmer} → {lot.quantity} kg • {lot.location}
            </p>
          ))}

          <h2>Total Compatible Supply: {totalSupply} kg</h2>

          <Button onClick={() => navigate("aggregation")}>
            Build Dynamic Aggregation
          </Button>
        </Card>
      </Layout>
    );
  }

  /* ==================================================
     AI SUPPLY AGGREGATION
  ================================================== */

  if (page === "aggregation") {
    function toggleLot(id) {
      setConfirmedIds((oldIds) =>
        oldIds.includes(id)
          ? oldIds.filter((item) => item !== id)
          : [...oldIds, id]
      );
    }

    return (
      <Layout {...layoutProps} title="📦 Dynamic AI Supply Aggregation">
        <Card>
          <p>
            The system combines multiple compatible farmer lots to meet
            the buyer's required quantity.
          </p>
        </Card>

        <div className="grid">
          {matches.map((lot) => {
            const selected = confirmedIds.includes(lot.id);

            return (
              <Card
                key={lot.id}
                className={selected ? "selected" : ""}
              >
                <h2>{lot.farmer}</h2>
                <p>Crop: {lot.crop}</p>
                <p>Quantity: {lot.quantity} kg</p>
                <p>Location: {lot.location}</p>

                <Button
                  className={selected ? "success" : ""}
                  onClick={() => toggleLot(lot.id)}
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
          <h2>Aggregated Supply: {confirmedQuantity} kg</h2>
          <h2>Remaining Requirement: {remainingQuantity} kg</h2>

          {remainingQuantity === 0 ? (
            <div className="success-box">
              Requirement successfully matched using dynamic aggregation.
            </div>
          ) : (
            <div className="warning">
              Additional compatible supply is required.
            </div>
          )}
        </Card>
      </Layout>
    );
  }

  /* ==================================================
     FPO DASHBOARD
  ================================================== */

  if (page === "fpo-dashboard") {
    const items = [
      ["👨‍🌾", "Member Farmers", "fpo-members"],
      ["📦", "Aggregate Crop Lots", "fpo-lots"],
      ["🛒", "Market Requirements", "fpo-requirements"],
      ["🚛", "Collection & Logistics", "fpo-logistics"],
      ["💳", "Payments", "payments"],
      ["🧾", "Transactions", "transactions"],
      ["📦", "Orders", "orders"],
      ["👤", "Profile", "profile"],
    ];

    return (
      <Layout
        {...layoutProps}
        title="🏘️ FPO / Cooperative Dashboard"
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

  /* ==================================================
     FPO MEMBERS
  ================================================== */

  if (page === "fpo-members") {
    return (
      <Layout {...layoutProps} title="👨‍🌾 Member Farmers">
        <div className="grid">
          {lots.map((lot) => (
            <Card key={lot.id}>
              <h2>{lot.farmer}</h2>
              <p>Crop: {lot.crop}</p>
              <p>Quantity: {lot.quantity} kg</p>
              <p>Location: {lot.location}</p>
              <p>Quality: {lot.quality}</p>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  /* ==================================================
     FPO LOTS
  ================================================== */

  if (page === "fpo-lots") {
    const total = lots.reduce(
      (sum, lot) => sum + Number(lot.quantity),
      0
    );

    return (
      <Layout {...layoutProps} title="📦 FPO Crop Aggregation">
        <Card>
          <h2>Total Available Supply: {total} kg</h2>
          <p>
            FPO aggregation combines multiple farmer lots for bulk
            market requirements.
          </p>
        </Card>

        <div className="grid">
          {lots.map((lot) => (
            <Card key={lot.id}>
              <h2>{lot.crop}</h2>
              <p>Farmer: {lot.farmer}</p>
              <p>Quantity: {lot.quantity} kg</p>
              <p>Location: {lot.location}</p>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  /* ==================================================
     FPO REQUIREMENTS
  ================================================== */

  if (page === "fpo-requirements") {
    return (
      <Layout {...layoutProps} title="🛒 Market Requirements">
        <Card>
          <h2>Current Market Demand</h2>

          <p>Crop: {requirement.crop}</p>
          <p>Required Quantity: {requirement.quantity} kg</p>
          <p>Quality: {requirement.quality}</p>
          <p>Delivery Location: {requirement.location}</p>

          <p>
            The FPO can dynamically identify member supply and
            coordinate aggregation.
          </p>
        </Card>
      </Layout>
    );
  }

  /* ==================================================
     PAYMENTS
  ================================================== */

  if (page === "payments") {
    const flow =
      role === "Farmer"
        ? [
            "Payment Pending",
            "Buyer Payment Initiated",
            "Verification",
            "Payment Received",
            "Transaction Successful",
          ]
        : role === "Buyer"
        ? [
            "Payment Pending",
            "Payment Initiated",
            "Verification",
            "Payment Completed",
            "Transaction Successful",
          ]
        : [
            "Collection Pending",
            "Payment Processing",
            "Member Distribution",
            "Payment Completed",
            "Transaction Successful",
          ];

    function updatePayment() {
      const index = flow.indexOf(paymentStatus);

      const next =
        index === -1
          ? flow[0]
          : flow[Math.min(index + 1, flow.length - 1)];

      setPaymentStatus(next);

      if (next === "Transaction Successful") {
        setTransactions((oldTransactions) => [
          ...oldTransactions,
          {
            id: Date.now(),
            crop: selectedLot?.crop || requirement.crop,
            buyer: selectedBuyer?.buyer || userName,
            amount:
              selectedLot
                ? selectedLot.quantity * selectedLot.price
                : 0,
            status: "Successful",
            date: new Date().toLocaleDateString(),
            reliability:
              selectedBuyer?.reliability || 90,
          },
        ]);
      }
    }

    return (
      <Layout {...layoutProps} title="💳 Payment & Transaction Status">
        <Card>
          <h2>{paymentStatus}</h2>

          <div className="progress">
            {flow.map((item) => (
              <p
                key={item}
                className={
                  paymentStatus === item ? "active-step" : ""
                }
              >
                {item}
              </p>
            ))}
          </div>

          {paymentStatus !== "Transaction Successful" && (
            <Button onClick={updatePayment}>
              Update Payment Status
            </Button>
          )}

          {paymentStatus === "Transaction Successful" && (
            <div className="success-box">
              Transaction completed successfully and recorded in
              transaction history.
            </div>
          )}
        </Card>
      </Layout>
    );
  }

  /* ==================================================
     TRANSACTION HISTORY
  ================================================== */

  if (page === "transactions") {
    return (
      <Layout {...layoutProps} title="🧾 Transaction History">
        {transactions.map((transaction) => (
          <Card key={transaction.id}>
            <h2>{transaction.crop}</h2>
            <p>Customer / Buyer: {transaction.buyer}</p>
            <p>Amount: ₹{transaction.amount}</p>
            <p>Date: {transaction.date}</p>
            <p>Status: {transaction.status}</p>
            <p>Reliability: {transaction.reliability}%</p>
          </Card>
        ))}
      </Layout>
    );
  }

  /* ==================================================
     ORDERS
  ================================================== */

  if (page === "orders") {
    const flow =
      role === "Farmer"
        ? [
            "Order Received",
            "Order Accepted",
            "Pickup Scheduled",
            "Collected",
            "Payment Received",
          ]
        : role === "Buyer"
        ? [
            "Order Received",
            "Order Accepted",
            "Pickup Scheduled",
            "In Transit",
            "Delivered",
            "Payment Completed",
          ]
        : [
            "Aggregation Planned",
            "Collection Scheduled",
            "Collected",
            "Bulk Dispatch",
            "Delivered",
            "Payment Completed",
          ];

    function updateOrder() {
      const index = flow.indexOf(orderStatus);

      const next =
        index === -1
          ? flow[0]
          : flow[Math.min(index + 1, flow.length - 1)];

      setOrderStatus(next);
    }

    return (
      <Layout {...layoutProps} title="📦 Order Tracking">
        <Card>
          <h2>{orderStatus}</h2>

          <div className="progress">
            {flow.map((item) => (
              <p
                key={item}
                className={
                  orderStatus === item ? "active-step" : ""
                }
              >
                {item}
              </p>
            ))}
          </div>

          {orderStatus !== flow[flow.length - 1] && (
            <Button onClick={updateOrder}>
              Update Order Status
            </Button>
          )}

          <Button
            className="secondary"
            onClick={() => navigate("disputes")}
          >
            Raise Issue
          </Button>
        </Card>
      </Layout>
    );
  }

  /* ==================================================
     DISPUTES
  ================================================== */

  if (page === "disputes") {
    function submitDispute() {
      if (!dispute) {
        alert("Please select an issue.");
        return;
      }

      alert(`${dispute} submitted successfully.`);
      setDispute("");
    }

    return (
      <Layout {...layoutProps} title="⚖️ Dispute & Grievance">
        <Card>
          <Select
            label="Issue Type"
            value={dispute}
            onChange={(e) => setDispute(e.target.value)}
          >
            <option value="">Select an issue</option>
            <option>Payment Issue</option>
            <option>Quantity Issue</option>
            <option>Quality Issue</option>
            <option>Delivery Issue</option>
            <option>Transaction Issue</option>
          </Select>

          <Button onClick={submitDispute}>
            Submit Issue
          </Button>
        </Card>
      </Layout>
    );
  }

  /* ==================================================
     OFFLINE SUPPORT
  ================================================== */

  if (page === "offline-support") {
    return (
      <Layout {...layoutProps} title="📡 Offline Support">
        <Card>
          <h2>
            Current Mode: {online ? "Online" : "Offline"}
          </h2>

          <p>
            Previously loaded crop and market information remains
            accessible.
          </p>

          <p>
            Actions can be synchronized when the connection returns.
          </p>

          <Button onClick={() => setOnline((old) => !old)}>
            {online ? "Simulate Offline" : "Restore Internet"}
          </Button>
        </Card>
      </Layout>
    );
  }

  /* ==================================================
     PROFILE
  ================================================== */

  if (page === "profile") {
    return (
      <Layout {...layoutProps} title="👤 Profile">
        <Card>
          <h2>{userName}</h2>

          <p>
            Role: <strong>{role}</strong>
          </p>

          <p>
            Contact: <strong>{contact}</strong>
          </p>

          <p>
            Language: <strong>{language}</strong>
          </p>

          <Button className="danger" onClick={logout}>
            🚪 {t.logout}
          </Button>
        </Card>
      </Layout>
    );
  }

  /* ==================================================
     FALLBACK
  ================================================== */

  return (
    <Layout {...layoutProps} title="Application">
      <Card>
        <h2>Page not found.</h2>

        <Button onClick={goDashboard}>
          Go to Dashboard
        </Button>
      </Card>
    </Layout>
  );
}

export default App;