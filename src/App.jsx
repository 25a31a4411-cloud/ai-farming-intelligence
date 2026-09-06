import { useMemo, useState } from "react";
import "./App.css";

const initialLots = [
  {
    id: 1,
    crop: "Tomato",
    quantity: 2000,
    location: "Kakinada",
    harvest: "2026-09-08",
    available: "2026-09-08",
    quality: "A Grade",
    price: 24,
    farmer: "Farmer A",
    status: "Available",
  },
  {
    id: 2,
    crop: "Tomato",
    quantity: 3000,
    location: "Pithapuram",
    harvest: "2026-09-09",
    available: "2026-09-09",
    quality: "A Grade",
    price: 23,
    farmer: "Farmer B",
    status: "Available",
  },
  {
    id: 3,
    crop: "Tomato",
    quantity: 5000,
    location: "Samalkota",
    harvest: "2026-09-10",
    available: "2026-09-10",
    quality: "A Grade",
    price: 25,
    farmer: "Farmer C",
    status: "Available",
  },
];

const translations = {
  English: {
    app: "AI Farming Selling Intelligence",
    slogan: "Sell Smarter. Earn Better.",
    getStarted: "Get Started",
    chooseLanguage: "Choose Your Language",
    selectTelugu: "Select Telugu",
    selectEnglish: "Select English",
    continue: "Continue",
    back: "Back",
    selectRole: "Select Your Role",
    farmer: "Farmer",
    buyer: "Buyer",
    fpo: "FPO / Cooperative",
    select: "Select",
    login: "Login / Registration",
    name: "Name",
    mobile: "Mobile / Email",
    password: "Password",
    enter: "Enter Application",
    online: "Online",
    offline: "Offline",
    farmerDashboard: "Farmer Dashboard",
    buyerDashboard: "Buyer Dashboard",
    addCrop: "Add Crop",
    cropLots: "My Crop Lots",
    aiRecommendations: "AI Recommendations",
    marketIntelligence: "Market Intelligence",
    orders: "Orders",
    payments: "Payments",
    notifications: "Notifications",
    profile: "Profile",
    saveCrop: "Save Crop & Continue",
    voice: "Voice Input",
    open: "Open",
    available: "Available",
    quantity: "Quantity",
    location: "Location",
    quality: "Quality",
    search: "Search",
    viewDetails: "View Details",
    accept: "Accept",
    decline: "Decline",
    accepted: "Accepted",
    lowRisk: "Low Risk",
    mediumRisk: "Medium Risk",
    highRisk: "High Risk",
    highConfidence: "High Confidence",
    success: "Success",
  },

  Telugu: {
    app: "AI వ్యవసాయ అమ్మకాల మేధస్సు",
    slogan: "తెలివిగా అమ్మండి. మెరుగ్గా సంపాదించండి.",
    getStarted: "ప్రారంభించండి",
    chooseLanguage: "మీ భాషను ఎంచుకోండి",
    selectTelugu: "తెలుగు ఎంచుకోండి",
    selectEnglish: "ఇంగ్లీష్ ఎంచుకోండి",
    continue: "కొనసాగించండి",
    back: "వెనుకకు",
    selectRole: "మీ పాత్రను ఎంచుకోండి",
    farmer: "రైతు",
    buyer: "కొనుగోలుదారు",
    fpo: "FPO / సహకార సంఘం",
    select: "ఎంచుకోండి",
    login: "లాగిన్ / నమోదు",
    name: "పేరు",
    mobile: "మొబైల్ / ఇమెయిల్",
    password: "పాస్‌వర్డ్",
    enter: "అప్లికేషన్‌లోకి ప్రవేశించండి",
    online: "ఆన్‌లైన్",
    offline: "ఆఫ్‌లైన్",
    farmerDashboard: "రైతు డాష్‌బోర్డ్",
    buyerDashboard: "కొనుగోలుదారు డాష్‌బోర్డ్",
    addCrop: "పంట జోడించండి",
    cropLots: "నా పంటలు",
    aiRecommendations: "AI సిఫార్సులు",
    marketIntelligence: "మార్కెట్ సమాచారం",
    orders: "ఆర్డర్లు",
    payments: "చెల్లింపులు",
    notifications: "నోటిఫికేషన్లు",
    profile: "ప్రొఫైల్",
    saveCrop: "పంటను సేవ్ చేసి కొనసాగించండి",
    voice: "వాయిస్ ఇన్‌పుట్",
    open: "తెరవండి",
    available: "అందుబాటులో ఉంది",
    quantity: "పరిమాణం",
    location: "స్థానం",
    quality: "నాణ్యత",
    search: "వెతకండి",
    viewDetails: "వివరాలు చూడండి",
    accept: "అంగీకరించండి",
    decline: "తిరస్కరించండి",
    accepted: "అంగీకరించబడింది",
    lowRisk: "తక్కువ ప్రమాదం",
    mediumRisk: "మధ్యస్థ ప్రమాదం",
    highRisk: "అధిక ప్రమాదం",
    highConfidence: "అధిక విశ్వాసం",
    success: "విజయం",
  },
};

const screenNames = [
  "Splash Screen",
  "Language Selection",
  "Role Selection",
  "Login / Registration",
  "Farmer Dashboard",
  "Smart Crop Listing",
  "Crop Image & Quality Assessment",
  "My Crop Lots",
  "Buyer Dashboard",
  "Create Buyer Requirement",
  "Available Supply & Crop Search",
  "Crop Details",
  "Buyer Crop Inquiry",
  "Opportunity Detection & Supply Matching",
  "Dynamic AI Supply Aggregation",
  "Farmer Confirmation Request",
  "Quantity Gap Detection",
  "Market Intelligence Dashboard",
  "Demand & Future Opportunity Intelligence",
  "Next Crop Opportunity Insights",
  "Estimated Net Return Analysis",
  "Opportunity Score",
  "AI-Powered Top 3 Recommendations",
  "Explainable AI",
  "Sell / Wait / Store Intelligence",
  "Storage Feasibility Analysis",
  "Scenario-Based Return Analysis",
  "Logistics & Distance Analysis",
  "Delivery Responsibility",
  "Smart Collection Point",
  "Backup Logistics Planning",
  "Buyer Reliability Profile",
  "AI-Assisted Transaction Risk Detection",
  "Data Confidence Indicator",
  "Offer Comparison & Negotiation",
  "Buyer Aggregated Supply Review",
  "Digital Transaction Agreement",
  "Payment Tracking",
  "Order & Delivery Tracking",
  "Dispute & Grievance System",
  "Feedback & Actual Outcome",
  "Dynamic Recommendation Updates",
  "Low Internet / Offline Support",
  "Safe Failure Handling",
];

function App() {
  const [screen, setScreen] = useState(1);
  const [language, setLanguage] = useState("English");
  const [role, setRole] = useState("Farmer");
  const [loggedIn, setLoggedIn] = useState(false);

  const [lots, setLots] = useState(initialLots);
  const [selectedLot, setSelectedLot] = useState(initialLots[0]);

  const [cropForm, setCropForm] = useState({
    crop: "Tomato",
    quantity: 1000,
    location: "Kakinada",
    harvest: "2026-09-15",
    available: "2026-09-15",
    quality: "A Grade",
    price: 24,
  });

  const [requirement, setRequirement] = useState({
    crop: "Tomato",
    quantity: 10000,
    quality: "A Grade",
    location: "Kakinada",
    date: "2026-09-15",
    price: "20 - 30",
  });

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [confirmedIds, setConfirmedIds] = useState([]);

  const [deliveryMode, setDeliveryMode] =
    useState("Buyer Pickup");

  const [paymentStatus, setPaymentStatus] =
    useState("Payment Pending");

  const [orderStatus, setOrderStatus] =
    useState("Order Accepted");

  const [offer, setOffer] = useState(25);

  const [actualPrice, setActualPrice] = useState(25);
  const [actualLogistics, setActualLogistics] =
    useState(2000);

  const [dispute, setDispute] = useState("");
  const [online, setOnline] = useState(true);
  const [marketUpdated, setMarketUpdated] =
    useState(false);

  const t = translations[language];

  function go(number) {
    setScreen(Math.max(1, Math.min(44, number)));
  }

  const matches = useMemo(() => {
    return lots.filter((lot) => {
      const cropMatch =
        lot.crop.toLowerCase() ===
        requirement.crop.toLowerCase();

      const qualityMatch =
        requirement.quality === "Any Quality" ||
        lot.quality === requirement.quality;

      return (
        cropMatch &&
        qualityMatch &&
        lot.status === "Available"
      );
    });
  }, [lots, requirement.crop, requirement.quality]);

  const confirmedLots = lots.filter((lot) =>
    confirmedIds.includes(lot.id)
  );

  const confirmedQuantity =
    confirmedLots.reduce(
      (total, lot) =>
        total + Number(lot.quantity),
      0
    );

  const remainingQuantity =
    Math.max(
      0,
      Number(requirement.quantity) -
        confirmedQuantity
    );

  const totalSupply =
    matches.reduce(
      (total, lot) =>
        total + Number(lot.quantity),
      0
    );

  const estimatedSellingValue =
    Number(selectedLot.quantity) *
    Number(selectedLot.price);

  const transportationCost =
    Math.round(
      Number(selectedLot.quantity) * 0.8
    );

  const storageCost =
    Math.round(
      Number(selectedLot.quantity) * 0.3
    );

  const handlingCost =
    Math.round(
      Number(selectedLot.quantity) * 0.2
    );

  const estimatedNetReturn =
    estimatedSellingValue -
    transportationCost -
    storageCost -
    handlingCost;

  const opportunityScore =
    Math.min(
      100,
      Math.round(
        45 +
          (selectedLot.quality === "A Grade"
            ? 15
            : 8) +
          (selectedLot.quantity >= 1000
            ? 12
            : 5) +
          (selectedLot.price >= 20
            ? 10
            : 5) +
          8
      )
    );

  const recommendations = [
    {
      rank: 1,
      name: "Best Opportunity",
      buyer: "FreshMart Bulk Buyer",
      score: opportunityScore,
      net: estimatedNetReturn,
      distance: "18 km",
      risk: "Low",
    },
    {
      rank: 2,
      name: "Second Best",
      buyer: "Regional Wholesale Market",
      score: opportunityScore - 7,
      net: estimatedNetReturn - 1800,
      distance: "32 km",
      risk: "Medium",
    },
    {
      rank: 3,
      name: "Third Best",
      buyer: "Food Processing Buyer",
      score: opportunityScore - 13,
      net: estimatedNetReturn - 3000,
      distance: "45 km",
      risk: "Medium",
    },
  ];

  function addCrop() {
    const newLot = {
      id: Date.now(),
      ...cropForm,
      quantity: Number(cropForm.quantity),
      price: Number(cropForm.price),
      farmer: "Current Farmer",
      status: "Available",
    };

    setLots((old) => [...old, newLot]);
    setSelectedLot(newLot);

    go(7);
  }

  function sendQuestion(text = question) {
    if (!text.trim()) return;

    setMessages((old) => [
      ...old,
      {
        from: "Buyer",
        text,
      },
      {
        from: "AI",
        text:
          language === "English"
            ? "Verified listing information is shown. Questions requiring confirmation have been forwarded to the farmer."
            : "ధృవీకరించిన లిస్టింగ్ సమాచారం చూపబడింది. నిర్ధారణ అవసరమైన ప్రశ్న రైతుకు పంపబడింది.",
      },
    ]);

    setQuestion("");
  }

  function toggleConfirmation(id) {
    setConfirmedIds((old) =>
      old.includes(id)
        ? old.filter((item) => item !== id)
        : [...old, id]
    );
  }

  function nextPayment() {
    const flow = [
      "Payment Pending",
      "Payment Initiated",
      "Verification",
      "Payment Completed",
    ];

    const index =
      flow.indexOf(paymentStatus);

    setPaymentStatus(
      flow[
        Math.min(
          index + 1,
          flow.length - 1
        )
      ]
    );
  }

  function nextOrder() {
    const flow = [
      "Order Accepted",
      "Pickup Scheduled",
      "Collected",
      "In Transit",
      "Delivered",
      "Payment Completed",
    ];

    const index =
      flow.indexOf(orderStatus);

    setOrderStatus(
      flow[
        Math.min(
          index + 1,
          flow.length - 1
        )
      ]
    );
  }

  const Card = ({
    children,
    className = "",
  }) => (
    <div
      className={`card ${className}`}
    >
      {children}
    </div>
  );

  const Button = ({
    children,
    onClick,
    className = "",
  }) => (
    <button
      className={`btn ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );

  const Input = ({
    label,
    ...props
  }) => (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );

  const Select = ({
    label,
    children,
    ...props
  }) => (
    <label className="field">
      <span>{label}</span>

      <select {...props}>
        {children}
      </select>
    </label>
  );

  function Layout({
    title,
    children,
  }) {
    return (
      <main className="app">
        <header className="topbar">
          <div>
            <h2>
              🌾 {t.app}
            </h2>

            <small>
              Screen {screen}/44 —{" "}
              {screenNames[
                screen - 1
              ]}
            </small>
          </div>

          {loggedIn && (
            <div className="top-info">
              <span>
                {role}
              </span>

              <span>
                {language}
              </span>

              <span
                className={
                  online
                    ? "online"
                    : "offline"
                }
              >
                ●{" "}
                {online
                  ? t.online
                  : t.offline}
              </span>
            </div>
          )}
        </header>

        <section className="content">
          <h1>{title}</h1>

          {children}
        </section>

        <footer className="navigation">
          {screen > 1 && (
            <Button
              className="secondary"
              onClick={() =>
                go(screen - 1)
              }
            >
              ← {t.back}
            </Button>
          )}
        </footer>
      </main>
    );
  }

  // SCREEN 1
  if (screen === 1) {
    return (
      <main className="splash">
        <div className="logo">
          🌾🤖
        </div>

        <h1>{t.app}</h1>

        <p>{t.slogan}</p>

        <Button
          onClick={() => go(2)}
        >
          {t.getStarted} →
        </Button>
      </main>
    );
  }

  // SCREEN 2
  if (screen === 2) {
    return (
      <Layout
        title={t.chooseLanguage}
      >
        <div className="grid two">

          <Card
            className={
              language === "Telugu"
                ? "selected"
                : ""
            }
          >
            <h2>తెలుగు</h2>

            <Button
              onClick={() =>
                setLanguage("Telugu")
              }
            >
              {t.selectTelugu}
            </Button>
          </Card>

          <Card
            className={
              language === "English"
                ? "selected"
                : ""
            }
          >
            <h2>English</h2>

            <Button
              onClick={() =>
                setLanguage("English")
              }
            >
              {t.selectEnglish}
            </Button>
          </Card>
        </div>

        <br />

        <Button
          onClick={() => go(3)}
        >
          {t.continue} →
        </Button>
      </Layout>
    );
  }

  // SCREEN 3
  if (screen === 3) {
    const roles = [
      ["👨‍🌾", "Farmer", t.farmer],
      ["🏢", "Buyer", t.buyer],
      ["🏘️", "FPO / Cooperative", t.fpo],
    ];

    return (
      <Layout
        title={t.selectRole}
      >
        <div className="grid three">
          {roles.map(
            ([icon, value, label]) => (
              <Card
                key={value}
                className={
                  role === value
                    ? "selected"
                    : ""
                }
              >
                <h1>{icon}</h1>

                <h3>{label}</h3>

                <Button
                  onClick={() =>
                    setRole(value)
                  }
                >
                  {t.select}
                </Button>
              </Card>
            )
          )}
        </div>

        <Button
          onClick={() => go(4)}
        >
          {t.continue} →
        </Button>
      </Layout>
    );
  }

  // SCREEN 4
  if (screen === 4) {
    return (
      <Layout title={t.login}>
        <Card className="form-card">

          <Input
            label={t.name}
            placeholder="Enter your name"
          />

          <Input
            label={t.mobile}
            placeholder="Enter mobile or email"
          />

          <Input
            label={t.password}
            type="password"
            placeholder="Password"
          />

          <Button
            onClick={() => {
              setLoggedIn(true);

              if (
                role === "Buyer"
              ) {
                go(9);
              } else {
                go(5);
              }
            }}
          >
            {t.enter}
          </Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 5
  if (screen === 5) {
    const items = [
      ["➕", t.addCrop, 6],
      ["📦", t.cropLots, 8],
      ["🤖", t.aiRecommendations, 23],
      ["📊", t.marketIntelligence, 18],
      ["🛒", t.orders, 39],
      ["💳", t.payments, 38],
      ["🔔", t.notifications, 16],
      ["👤", t.profile, 43],
    ];

    return (
      <Layout
        title={`👨‍🌾 ${t.farmerDashboard}`}
      >
        <div className="grid three">
          {items.map(
            ([icon, name, target]) => (
              <Card key={name}>
                <h2>{icon}</h2>

                <h3>{name}</h3>

                <Button
                  onClick={() =>
                    go(target)
                  }
                >
                  {t.open}
                </Button>
              </Card>
            )
          )}
        </div>
      </Layout>
    );
  }

  // SCREEN 6
  if (screen === 6) {
    return (
      <Layout
        title="🌱 Smart Crop Listing"
      >
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
                quantity:
                  e.target.value,
              })
            }
          />

          <Input
            label="Location"
            value={cropForm.location}
            onChange={(e) =>
              setCropForm({
                ...cropForm,
                location:
                  e.target.value,
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
                harvest:
                  e.target.value,
              })
            }
          />

          <Input
            label="Selling Availability Date"
            type="date"
            value={cropForm.available}
            onChange={(e) =>
              setCropForm({
                ...cropForm,
                available:
                  e.target.value,
              })
            }
          />

          <Select
            label="Quality"
            value={cropForm.quality}
            onChange={(e) =>
              setCropForm({
                ...cropForm,
                quality:
                  e.target.value,
              })
            }
          >
            <option>
              A Grade
            </option>

            <option>
              B Grade
            </option>

            <option>
              Mixed Grade
            </option>
          </Select>

          <Input
            label="Expected Price / kg"
            type="number"
            value={cropForm.price}
            onChange={(e) =>
              setCropForm({
                ...cropForm,
                price:
                  e.target.value,
              })
            }
          />

          <Button
            className="secondary"
            onClick={() =>
              alert(
                language === "English"
                  ? "Voice input feature activated for prototype demo."
                  : "ప్రోటోటైప్ కోసం వాయిస్ ఇన్‌పుట్ ఫీచర్ యాక్టివేట్ చేయబడింది."
              )
            }
          >
            🎤 {t.voice}
          </Button>

          <Button
            onClick={addCrop}
          >
            {t.saveCrop}
          </Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 7
  if (screen === 7) {
    return (
      <Layout
        title="📷 Crop Image & Preliminary Quality Assessment"
      >
        <Card>

          <Input
            label="Upload Crop Image"
            type="file"
            accept="image/*"
          />

          <h3>
            Preliminary AI Assessment
          </h3>

          <p>
            Visible appearance:
            Good
          </p>

          <p>
            Uniformity: Good
          </p>

          <p>
            Possible visible defects:
            No major visible defect
            detected.
          </p>

          <div className="warning">
            ⚠️ Preliminary AI
            assessment — physical
            verification may be
            required.
          </div>

          <Button
            onClick={() => go(8)}
          >
            View My Crop Lots
          </Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 8
  if (screen === 8) {
    return (
      <Layout title="📦 My Crop Lots">

        <div className="grid">
          {lots.map((lot) => (
            <Card key={lot.id}>

              <h2>
                🌱 {lot.crop}
              </h2>

              <p>
                Quantity:{" "}
                {lot.quantity} kg
              </p>

              <p>
                Location:
                {lot.location}
              </p>

              <p>
                Quality:
                {lot.quality}
              </p>

              <p>
                Status:
                {lot.status}
              </p>

              <Button
                onClick={() => {
                  setSelectedLot(lot);
                  go(14);
                }}
              >
                Check Opportunities
              </Button>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  // SCREEN 9
  if (screen === 9) {
    const items = [
      ["🛒", "Create Requirement", 10],
      ["🔍", "Find Crops / Supply", 11],
      ["📋", "My Requirements", 14],
      ["📦", t.orders, 36],
      ["💳", "Transactions", 38],
      ["🔔", t.notifications, 13],
      ["👤", t.profile, 43],
    ];

    return (
      <Layout
        title={`🏢 ${t.buyerDashboard}`}
      >
        <div className="grid three">
          {items.map(
            ([icon, name, target]) => (
              <Card key={name}>

                <h2>{icon}</h2>

                <h3>{name}</h3>

                <Button
                  onClick={() =>
                    go(target)
                  }
                >
                  {t.open}
                </Button>
              </Card>
            )
          )}
        </div>
      </Layout>
    );
  }

  // SCREEN 10
  if (screen === 10) {
    return (
      <Layout
        title="🛒 Create Buyer Requirement"
      >
        <Card className="form-card">

          <Input
            label="Required Crop"
            value={requirement.crop}
            onChange={(e) =>
              setRequirement({
                ...requirement,
                crop:
                  e.target.value,
              })
            }
          />

          <Input
            label="Required Quantity (kg)"
            type="number"
            value={
              requirement.quantity
            }
            onChange={(e) =>
              setRequirement({
                ...requirement,
                quantity:
                  e.target.value,
              })
            }
          />

          <Select
            label="Quality Requirement"
            value={
              requirement.quality
            }
            onChange={(e) =>
              setRequirement({
                ...requirement,
                quality:
                  e.target.value,
              })
            }
          >
            <option>
              A Grade
            </option>

            <option>
              B Grade
            </option>

            <option>
              Any Quality
            </option>
          </Select>

          <Input
            label="Delivery Location"
            value={
              requirement.location
            }
            onChange={(e) =>
              setRequirement({
                ...requirement,
                location:
                  e.target.value,
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
                date:
                  e.target.value,
              })
            }
          />

          <Input
            label="Preferred Price Range"
            value={
              requirement.price
            }
            onChange={(e) =>
              setRequirement({
                ...requirement,
                price:
                  e.target.value,
              })
            }
          />

          <Button
            onClick={() => go(11)}
          >
            Create Demand Request
          </Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 11
  if (screen === 11) {
    return (
      <Layout
        title="🔍 Available Supply & Crop Search"
      >
        <Card>

          <Input
            label="Search Crop"
            value={requirement.crop}
            onChange={(e) =>
              setRequirement({
                ...requirement,
                crop:
                  e.target.value,
              })
            }
          />

          <p>
            Compatible Supply Found:
            {matches.length} lots
          </p>

          <div className="grid">
            {matches.map((lot) => (
              <Card key={lot.id}>

                <h3>
                  {lot.crop}
                </h3>

                <p>
                  {lot.quantity} kg
                </p>

                <p>
                  {lot.location}
                </p>

                <p>
                  {lot.quality}
                </p>

                <Button
                  onClick={() => {
                    setSelectedLot(lot);
                    go(12);
                  }}
                >
                  {t.viewDetails}
                </Button>
              </Card>
            ))}
          </div>
        </Card>
      </Layout>
    );
  }

  // SCREEN 12
  if (screen === 12) {
    return (
      <Layout title="Crop Details">
        <Card>

          <h2>
            🌱 {selectedLot.crop}
          </h2>

          <p>
            Available Quantity:
            {selectedLot.quantity} kg
          </p>

          <p>
            Farmer/FPO:
            {selectedLot.farmer}
          </p>

          <p>
            Location:
            {selectedLot.location}
          </p>

          <p>
            Harvest Date:
            {selectedLot.harvest}
          </p>

          <p>
            Availability Date:
            {selectedLot.available}
          </p>

          <p>
            Quality:
            {selectedLot.quality}
          </p>

          <Button
            onClick={() => go(13)}
          >
            💬 Ask About This Crop
          </Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 13
  if (screen === 13) {
    const quickQuestions = [
      "Quantity Available?",
      "Harvest Date?",
      "Request Images",
      "Delivery Available?",
      "Price Negotiable?",
    ];

    return (
      <Layout
        title="💬 Buyer Crop Inquiry"
      >
        <Card>

          <div className="quick-buttons">
            {quickQuestions.map(
              (q) => (
                <Button
                  key={q}
                  className="secondary"
                  onClick={() =>
                    sendQuestion(q)
                  }
                >
                  {q}
                </Button>
              )
            )}
          </div>

          <div className="messages">
            {messages.map(
              (message, index) => (
                <p
                  key={index}
                  className={
                    message.from ===
                    "Buyer"
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
            label="Custom Question"
            value={question}
            onChange={(e) =>
              setQuestion(
                e.target.value
              )
            }
            placeholder="Ask about this crop..."
          />

          <Button
            onClick={() =>
              sendQuestion()
            }
          >
            Send Question
          </Button>

          <Button
            className="secondary"
            onClick={() => go(14)}
          >
            Find Supply Match
          </Button>
        </Card>
      </Layout>
    );
  }

  // SCREENS 14–44
  // Continue functionality

  if (screen === 14) {
    return (
      <Layout title="🤖 Opportunity Detection & Supply Matching">
        <Card>
          <h3>Buyer Requirement</h3>
          <p>{requirement.quantity} kg {requirement.crop}</p>

          <h3>Compatible Supply</h3>

          {matches.map((lot) => (
            <p key={lot.id}>
              ✅ {lot.farmer} → {lot.quantity} kg
            </p>
          ))}

          <h2>Total Supply: {totalSupply} kg</h2>

          <Button onClick={() => go(15)}>
            Build Aggregated Supply
          </Button>
        </Card>
      </Layout>
    );
  }

  if (screen === 15) {
    return (
      <Layout title="⭐ Dynamic AI Supply Aggregation">
        <Card>
          <h3>Buyer Needs: {requirement.quantity} kg</h3>

          {matches.map((lot) => (
            <p key={lot.id}>
              {lot.farmer} → {lot.quantity} kg
            </p>
          ))}

          <h2>
            Aggregated Potential Supply:
            {totalSupply} kg
          </h2>

          <Button onClick={() => go(16)}>
            Send Farmer Confirmation Requests
          </Button>
        </Card>
      </Layout>
    );
  }

  if (screen === 16) {
    return (
      <Layout title="🔔 Farmer Confirmation Request">

        <div className="grid">
          {matches.map((lot) => {
            const confirmed =
              confirmedIds.includes(lot.id);

            return (
              <Card key={lot.id}>
                <h3>{lot.farmer}</h3>

                <p>
                  Buyer requires {lot.quantity} kg
                </p>

                <Button
                  className={
                    confirmed
                      ? "success"
                      : ""
                  }
                  onClick={() =>
                    toggleConfirmation(
                      lot.id
                    )
                  }
                >
                  {confirmed
                    ? "✅ Accepted"
                    : "✅ Accept"}
                </Button>

                <Button
                  className="danger"
                  onClick={() =>
                    setConfirmedIds(
                      (old) =>
                        old.filter(
                          (item) =>
                            item !==
                            lot.id
                        )
                    )
                  }
                >
                  ❌ Decline
                </Button>
              </Card>
            );
          })}
        </div>

        <Button onClick={() => go(17)}>
          Check Confirmed Quantity
        </Button>
      </Layout>
    );
  }

  if (screen === 17) {
    return (
      <Layout title="Quantity Gap Detection">
        <Card>
          <h2>Required: {requirement.quantity} kg</h2>
          <h2>Confirmed: {confirmedQuantity} kg</h2>
          <h2>Remaining: {remainingQuantity} kg</h2>

          {remainingQuantity > 0 ? (
            <div className="warning">
              Additional compatible farmers and
              nearby supply are being searched.
            </div>
          ) : (
            <div className="success-box">
              🎉 Full quantity can be fulfilled.
            </div>
          )}

          <Button onClick={() => go(18)}>
            Market Intelligence
          </Button>
        </Card>
      </Layout>
    );
  }

  if (screen === 18) {
    return (
      <Layout title="📊 Market Intelligence Dashboard">
        <div className="grid three">
          <Card><h3>Current Mandi Price</h3><h2>₹24/kg</h2></Card>
          <Card><h3>Historical Trend</h3><h2>📈 +8%</h2></Card>
          <Card><h3>Arrival Volume</h3><h2>Medium</h2></Card>
          <Card><h3>Price Change</h3><h2>+₹2</h2></Card>
        </div>

        <Button onClick={() => go(19)}>
          Demand Intelligence
        </Button>
      </Layout>
    );
  }

  if (screen === 19) {
    return (
      <Layout title="🔮 Demand & Future Opportunity Intelligence">
        <div className="grid two">
          <Card>
            <h2>✅ Confirmed Demand</h2>
            <p>{requirement.quantity} kg {requirement.crop}</p>
          </Card>

          <Card>
            <h2>📊 Potential Demand</h2>
            <p>AI estimated future opportunity.</p>
          </Card>
        </div>

        <Button onClick={() => go(20)}>
          Next Crop Opportunity
        </Button>
      </Layout>
    );
  }

  if (screen === 20) {
    return (
      <Layout title="🌱 Next Crop Opportunity Insights">
        <Card>
          <h2>Suggested: Tomato / Chilli</h2>
          <p>Based on demand, seasonal patterns and market trends.</p>

          <div className="warning">
            Recommendation only. Profit is not guaranteed.
          </div>

          <Button onClick={() => go(21)}>
            Analyze Net Return
          </Button>
        </Card>
      </Layout>
    );
  }

  if (screen === 21) {
    return (
      <Layout title="💰 Estimated Net Return Analysis">
        <Card>
          <p>Selling Value: ₹{estimatedSellingValue}</p>
          <p>− Transportation: ₹{transportationCost}</p>
          <p>− Storage: ₹{storageCost}</p>
          <p>− Handling: ₹{handlingCost}</p>

          <hr />

          <h2>
            Estimated Net Return:
            ₹{estimatedNetReturn}
          </h2>

          <Button onClick={() => go(22)}>
            Opportunity Score
          </Button>
        </Card>
      </Layout>
    );
  }

  if (screen === 22) {
    return (
      <Layout title="📍 Opportunity Score">
        <Card>
          <div className="score">
            {opportunityScore}/100
          </div>

          <p>
            Based on demand, net return,
            distance, quality and risk.
          </p>

          <Button onClick={() => go(23)}>
            Top 3 Recommendations
          </Button>
        </Card>
      </Layout>
    );
  }

  if (screen === 23) {
    return (
      <Layout title="🏆 AI-Powered Top 3 Recommendations">
        <div className="grid">
          {recommendations.map((item) => (
            <Card key={item.rank}>
              <h2>
                {item.rank === 1 ? "🥇" :
                 item.rank === 2 ? "🥈" : "🥉"}
                {" "}
                {item.name}
              </h2>

              <p>Buyer: {item.buyer}</p>
              <p>Score: {item.score}/100</p>
              <p>Net Return: ₹{item.net}</p>
              <p>Distance: {item.distance}</p>
              <p>Risk: {item.risk}</p>
            </Card>
          ))}
        </div>

        <Button onClick={() => go(24)}>
          Why is this recommended?
        </Button>
      </Layout>
    );
  }

  if (screen === 24) {
    return (
      <Layout title="🧾 Explainable AI">
        <Card>
          <ul>
            <li>Higher estimated net return</li>
            <li>Lower transportation cost</li>
            <li>Quantity matches demand</li>
            <li>Quality requirement matches</li>
            <li>Better reliability indicators</li>
            <li>Lower transaction risk</li>
          </ul>

          <Button onClick={() => go(25)}>
            Selling Decision
          </Button>
        </Card>
      </Layout>
    );
  }

  if (screen === 25) {
    return (
      <Layout title="Sell / Wait / Store Intelligence">
        <div className="grid three">
          <Card className="selected">
            <h2>🟢 Sell Now</h2>
            <p>Strong current opportunity.</p>
          </Card>

          <Card>
            <h2>🟡 Wait</h2>
            <p>Possible price improvement.</p>
          </Card>

          <Card>
            <h2>🔵 Consider Storage</h2>
            <p>Check storage and spoilage costs.</p>
          </Card>
        </div>

        <Button onClick={() => go(26)}>
          Compare Storage
        </Button>
      </Layout>
    );
  }

  if (screen === 26) {
    return (
      <Layout title="Storage Feasibility Analysis">
        <div className="grid two">
          <Card>
            <h2>Sell Now</h2>
            <p>₹{estimatedNetReturn}</p>
          </Card>

          <Card>
            <h2>Store Later</h2>
            <p>Potential Increase: ₹4000</p>
            <p>Storage Cost: ₹{storageCost}</p>
            <p>Spoilage Risk: Medium</p>
          </Card>
        </div>

        <Button onClick={() => go(27)}>
          View Scenarios
        </Button>
      </Layout>
    );
  }

  if (screen === 27) {
    return (
      <Layout title="📈 Scenario-Based Return Analysis">
        <div className="grid three">
          <Card><h2>Expected</h2><p>₹{estimatedNetReturn}</p></Card>
          <Card><h2>Better</h2><p>₹{estimatedNetReturn + 5000}</p></Card>
          <Card><h2>Risk</h2><p>₹{Math.max(0, estimatedNetReturn - 7000)}</p></Card>
        </div>

        <Button onClick={() => go(28)}>
          Logistics
        </Button>
      </Layout>
    );
  }

  if (screen === 28) {
    return (
      <Layout title="🚛 Logistics & Distance Analysis">
        <Card>
          <p>Buyer Location: {requirement.location}</p>
          <p>Estimated Distance: 18 km</p>
          <p>Delivery Date: {requirement.date}</p>
          <p>Transportation Cost: ₹{transportationCost}</p>

          <Button onClick={() => go(29)}>
            Delivery Responsibility
          </Button>
        </Card>
      </Layout>
    );
  }

  if (screen === 29) {
    const modes = [
      "Buyer Pickup",
      "Farmer Delivery",
      "Logistics Provider",
    ];

    return (
      <Layout title="Delivery Responsibility">
        <div className="grid three">
          {modes.map((mode) => (
            <Card
              key={mode}
              className={
                deliveryMode === mode
                  ? "selected"
                  : ""
              }
            >
              <h3>{mode}</h3>

              <Button
                onClick={() =>
                  setDeliveryMode(mode)
                }
              >
                Select
              </Button>
            </Card>
          ))}
        </div>

        <Button onClick={() => go(30)}>
          Collection Point
        </Button>
      </Layout>
    );
  }

  if (screen === 30) {
    return (
      <Layout title="📦 Smart Collection Point">
        <Card>
          <h2>
            Multiple Farmers → Collection Point → Bulk Buyer
          </h2>

          <p>
            Participating Farmers:
            {confirmedLots.length}
          </p>

          <p>
            Confirmed Quantity:
            {confirmedQuantity} kg
          </p>

          <Button onClick={() => go(31)}>
            Backup Logistics
          </Button>
        </Card>
      </Layout>
    );
  }

  if (screen === 31) {
    return (
      <Layout title="Backup Logistics Planning">
        <div className="grid">
          <Card>🚚 Alternative Provider</Card>
          <Card>🚛 Buyer Pickup</Card>
          <Card>📦 Collection Point</Card>
          <Card>📅 Reschedule Delivery</Card>
        </div>

        <Button onClick={() => go(32)}>
          Buyer Reliability
        </Button>
      </Layout>
    );
  }

  if (screen === 32) {
    return (
      <Layout title="⭐ Buyer Reliability Profile">
        <Card>
          <p>Verification: Verified</p>
          <p>Transaction History: Established</p>
          <p>Payment Behaviour: Good</p>
          <p>Cancellation Pattern: Low</p>

          <Button onClick={() => go(33)}>
            Analyze Risk
          </Button>
        </Card>
      </Layout>
    );
  }

  if (screen === 33) {
    return (
      <Layout title="🚨 AI-Assisted Transaction Risk Detection">
        <Card>
          <p>Unusual Price: No</p>
          <p>Quantity Match: Compatible</p>
          <p>Logistics: Feasible</p>
          <p>Delivery: Feasible</p>

          <div className="success-box">
            🟢 LOW RISK
          </div>

          <Button onClick={() => go(34)}>
            Data Confidence
          </Button>
        </Card>
      </Layout>
    );
  }

  if (screen === 34) {
    return (
      <Layout title="📊 Data Confidence Indicator">
        <Card>
          <div className="score">
            🟢 High Confidence
          </div>

          <p>
            Data available for recommendation.
          </p>

          <Button onClick={() => go(35)}>
            View Offers
          </Button>
        </Card>
      </Layout>
    );
  }

  if (screen === 35) {
    return (
      <Layout title="💰 Offer Comparison & Negotiation">

        <div className="grid three">
          <Card>
            <h3>Buyer A</h3>
            <h2>₹25/kg</h2>
          </Card>

          <Card>
            <h3>Buyer B</h3>
            <h2>₹24/kg</h2>
          </Card>

          <Card>
            <h3>Buyer C</h3>
            <h2>₹26/kg</h2>
          </Card>
        </div>

        <Input
          label="Negotiated Price"
          type="number"
          value={offer}
          onChange={(e) =>
            setOffer(e.target.value)
          }
        />

        <Button onClick={() => go(36)}>
          Accept ₹{offer}/kg
        </Button>
      </Layout>
    );
  }

  if (screen === 36) {
    return (
      <Layout title="Buyer Aggregated Supply Review">
        <Card>
          <p>Total Confirmed: {confirmedQuantity} kg</p>
          <p>Farmers: {confirmedLots.length}</p>
          <p>Crop: {requirement.crop}</p>
          <p>
            Fulfilment:
            {confirmedQuantity >= requirement.quantity
              ? " Full"
              : " Partial"}
          </p>

          <Button onClick={() => go(37)}>
            Create Agreement
          </Button>
        </Card>
      </Layout>
    );
  }

  if (screen === 37) {
    return (
      <Layout title="📄 Digital Transaction Agreement">
        <Card>
          <p>Crop: {requirement.crop}</p>
          <p>Quantity: {confirmedQuantity} kg</p>
          <p>Price: ₹{offer}/kg</p>
          <p>Delivery Date: {requirement.date}</p>
          <p>Delivery: {deliveryMode}</p>
          <p>Payment Terms: After verification.</p>

          <Button onClick={() => go(38)}>
            Confirm Agreement
          </Button>
        </Card>
      </Layout>
    );
  }

  if (screen === 38) {
    return (
      <Layout title="💳 Payment Tracking">
        <Card>
          <h2>{paymentStatus}</h2>

          {paymentStatus !==
            "Payment Completed" && (
            <Button onClick={nextPayment}>
              Update Payment Status
            </Button>
          )}

          <Button
            className="secondary"
            onClick={() => go(39)}
          >
            Order Tracking
          </Button>
        </Card>
      </Layout>
    );
  }

  if (screen === 39) {
    return (
      <Layout title="📦 Order & Delivery Tracking">
        <Card>
          <h2>{orderStatus}</h2>

          {orderStatus !==
            "Payment Completed" && (
            <Button onClick={nextOrder}>
              Update Order Status
            </Button>
          )}

          <Button
            className="secondary"
            onClick={() => go(40)}
          >
            Raise Dispute
          </Button>
        </Card>
      </Layout>
    );
  }

  if (screen === 40) {
    return (
      <Layout title="⚖️ Dispute & Grievance System">
        <Card>

          <Select
            label="Issue Type"
            value={dispute}
            onChange={(e) =>
              setDispute(
                e.target.value
              )
            }
          >
            <option value="">
              Select Issue
            </option>

            <option>
              Payment Issue
            </option>

            <option>
              Quantity Issue
            </option>

            <option>
              Quality Issue
            </option>

            <option>
              Delivery Issue
            </option>
          </Select>

          <Button
            onClick={() => {
              if (dispute) {
                alert(
                  `${dispute} raised successfully.`
                );
              }
            }}
          >
            Raise Issue
          </Button>

          <Button
            onClick={() => go(41)}
          >
            Actual Outcome
          </Button>
        </Card>
      </Layout>
    );
  }

  if (screen === 41) {
    const actualReturn =
      Number(selectedLot.quantity) *
        Number(actualPrice) -
      Number(actualLogistics);

    return (
      <Layout title="Feedback & Actual Outcome">
        <Card className="form-card">

          <Input
            label="Actual Selling Price"
            type="number"
            value={actualPrice}
            onChange={(e) =>
              setActualPrice(
                e.target.value
              )
            }
          />

          <Input
            label="Actual Logistics Cost"
            type="number"
            value={actualLogistics}
            onChange={(e) =>
              setActualLogistics(
                e.target.value
              )
            }
          />

          <p>
            Estimated Return:
            ₹{estimatedNetReturn}
          </p>

          <h2>
            Actual Return:
            ₹{actualReturn}
          </h2>

          <Button
            onClick={() => go(42)}
          >
            Update Recommendations
          </Button>
        </Card>
      </Layout>
    );
  }

  if (screen === 42) {
    return (
      <Layout title="🔄 Dynamic Recommendation Updates">
        <Card>

          <Button
            onClick={() =>
              setMarketUpdated(
                !marketUpdated
              )
            }
          >
            Simulate Market Change
          </Button>

          {marketUpdated && (
            <div className="warning">
              ⚠️ Market conditions changed.
              Recommendations updated.
            </div>
          )}

          <Button
            onClick={() => go(43)}
          >
            Offline Support
          </Button>
        </Card>
      </Layout>
    );
  }

  if (screen === 43) {
    return (
      <Layout title="📡 Low Internet / Offline Support">
        <Card>

          <h2>
            {online
              ? "🟢 Online"
              : "🔴 Offline"}
          </h2>

          <p>
            Pending actions can be saved.
          </p>

          <p>
            Previous information remains available.
          </p>

          <Button
            onClick={() =>
              setOnline(!online)
            }
          >
            {online
              ? "Simulate Offline"
              : "Restore Internet"}
          </Button>

          <Button
            onClick={() => go(44)}
          >
            Safe Failure Handling
          </Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 44
  return (
    <Layout title="⚙️ Safe Failure Handling">
      <Card>

        <h3>
          If market data fails
        </h3>

        <p>
          Show last verified data
          and timestamp.
        </p>

        <h3>
          If AI confidence is low
        </h3>

        <p>
          Insufficient data for a
          reliable recommendation.
        </p>

        <h3>
          If payment verification fails
        </h3>

        <p>
          Transaction Pending Verification
        </p>

        <div className="success-box">
          🎉 All 44 screens are available
          and functional.
        </div>

        <Button onClick={() => go(5)}>
          Farmer Dashboard
        </Button>

        <Button
          className="secondary"
          onClick={() => go(9)}
        >
          Buyer Dashboard
        </Button>
      </Card>
    </Layout>
  );
}

export default App;