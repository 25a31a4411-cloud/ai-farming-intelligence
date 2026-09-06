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
    confirmed: false,
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
    confirmed: false,
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
    confirmed: false,
  },
];

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
  const [messages, setMessages] = useState([
    {
      from: "AI",
      text: "The listing currently shows 2,000 kg available and harvest details.",
    },
  ]);

  const [confirmedIds, setConfirmedIds] = useState([]);
  const [deliveryMode, setDeliveryMode] = useState("Buyer Pickup");
  const [paymentStatus, setPaymentStatus] = useState("Payment Pending");
  const [orderStatus, setOrderStatus] = useState("Order Accepted");
  const [offer, setOffer] = useState(25);
  const [actualPrice, setActualPrice] = useState(25);
  const [actualLogistics, setActualLogistics] = useState(2000);
  const [dispute, setDispute] = useState("");
  const [online, setOnline] = useState(true);
  const [marketUpdated, setMarketUpdated] = useState(false);

  const matches = useMemo(() => {
    return lots.filter(
      (lot) =>
        lot.crop.toLowerCase() === requirement.crop.toLowerCase() &&
        lot.quantity > 0 &&
        lot.status === "Available"
    );
  }, [lots, requirement.crop]);

  const confirmedLots = lots.filter((lot) =>
    confirmedIds.includes(lot.id)
  );

  const confirmedQuantity = confirmedLots.reduce(
    (total, lot) => total + Number(lot.quantity),
    0
  );

  const remainingQuantity = Math.max(
    0,
    Number(requirement.quantity) - confirmedQuantity
  );

  const totalSupply = matches.reduce(
    (total, lot) => total + Number(lot.quantity),
    0
  );

  const estimatedSellingValue =
    Number(selectedLot.quantity || 0) * Number(selectedLot.price || 0);

  const transportationCost = Math.round(
    Number(selectedLot.quantity || 0) * 0.8
  );

  const storageCost = Math.round(
    Number(selectedLot.quantity || 0) * 0.3
  );

  const handlingCost = Math.round(
    Number(selectedLot.quantity || 0) * 0.2
  );

  const estimatedNetReturn =
    estimatedSellingValue -
    transportationCost -
    storageCost -
    handlingCost;

  const opportunityScore = Math.min(
    100,
    Math.round(
      45 +
        (selectedLot.quality === "A Grade" ? 15 : 8) +
        (selectedLot.quantity >= 1000 ? 12 : 5) +
        (selectedLot.price >= 20 ? 10 : 5) +
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
      score: Math.max(0, opportunityScore - 7),
      net: estimatedNetReturn - 1800,
      distance: "32 km",
      risk: "Medium",
    },
    {
      rank: 3,
      name: "Third Best",
      buyer: "Food Processing Buyer",
      score: Math.max(0, opportunityScore - 13),
      net: estimatedNetReturn - 3000,
      distance: "45 km",
      risk: "Medium",
    },
  ];

  function go(n) {
    setScreen(Math.max(1, Math.min(44, n)));
  }

  function addCrop() {
    const newLot = {
      id: Date.now(),
      ...cropForm,
      quantity: Number(cropForm.quantity),
      price: Number(cropForm.price),
      farmer: "Current Farmer",
      status: "Available",
      confirmed: false,
    };

    setLots([...lots, newLot]);
    setSelectedLot(newLot);
    go(7);
  }

  function sendQuestion(text = question) {
    if (!text.trim()) return;

    setMessages((old) => [
      ...old,
      { from: "Buyer", text },
      {
        from: "AI",
        text:
          "Verified listing information is shown above. If confirmation is required, the question has been forwarded to the farmer.",
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

    const index = flow.indexOf(paymentStatus);
    setPaymentStatus(flow[Math.min(index + 1, flow.length - 1)]);
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

    const index = flow.indexOf(orderStatus);
    setOrderStatus(flow[Math.min(index + 1, flow.length - 1)]);
  }

  const Card = ({ children, className = "" }) => (
    <div className={`card ${className}`}>{children}</div>
  );

  const Button = ({ children, onClick, type = "button", className = "" }) => (
    <button type={type} className={`btn ${className}`} onClick={onClick}>
      {children}
    </button>
  );

  const Input = ({ label, ...props }) => (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );

  const Select = ({ label, children, ...props }) => (
    <label className="field">
      <span>{label}</span>
      <select {...props}>{children}</select>
    </label>
  );

  function Layout({ title, children, next, back = true }) {
    return (
      <main className="app">
        <header className="topbar">
          <div>
            <h2>🌾 AI Farming Selling Intelligence</h2>
            <small>Screen {screen}/44 — {screenNames[screen - 1]}</small>
          </div>

          {loggedIn && (
            <div className="top-info">
              <span>{role}</span>
              <span>{language}</span>
              <span className={online ? "online" : "offline"}>
                {online ? "● Online" : "● Offline"}
              </span>
            </div>
          )}
        </header>

        <section className="content">
          <h1>{title}</h1>
          {children}
        </section>

        <footer className="navigation">
          {back && screen > 1 && (
            <Button className="secondary" onClick={() => go(screen - 1)}>
              ← Back
            </Button>
          )}

          {next && (
            <Button onClick={() => go(next)}>
              Continue →
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
        <div className="logo">🌾🤖</div>
        <h1>AI Farming Selling Intelligence</h1>
        <p>Sell Smarter. Earn Better.</p>
        <Button onClick={() => go(2)}>Get Started →</Button>
      </main>
    );
  }

  // SCREEN 2
  if (screen === 2) {
    return (
      <Layout title="Choose Your Language" next={3}>
        <div className="grid two">
          <Card>
            <h2>తెలుగు</h2>
            <Button onClick={() => setLanguage("తెలుగు")}>
              Select Telugu
            </Button>
          </Card>
          <Card>
            <h2>English</h2>
            <Button onClick={() => setLanguage("English")}>
              Select English
            </Button>
          </Card>
        </div>
        <p className="muted">
          Future expansion: Other regional languages.
        </p>
      </Layout>
    );
  }

  // SCREEN 3
  if (screen === 3) {
    return (
      <Layout title="Select Your Role" next={4}>
        <div className="grid three">
          {["Farmer", "Buyer", "FPO / Cooperative"].map((item) => (
            <Card key={item} className={role === item ? "selected" : ""}>
              <h2>
                {item === "Farmer"
                  ? "👨‍🌾"
                  : item === "Buyer"
                  ? "🏢"
                  : "🏘️"}
              </h2>
              <h3>{item}</h3>
              <Button onClick={() => setRole(item)}>Select</Button>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  // SCREEN 4
  if (screen === 4) {
    return (
      <Layout title="Login / Registration" back>
        <Card className="form-card">
          <Input label="Name" placeholder="Enter your name" />
          <Input label="Mobile / Email" placeholder="Enter mobile or email" />
          <Input label="Password" type="password" placeholder="Password" />
          <Button
            onClick={() => {
              setLoggedIn(true);
              go(role === "Buyer" ? 9 : 5);
            }}
          >
            Enter Application
          </Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 5
  if (screen === 5) {
    return (
      <Layout title="👨‍🌾 Farmer Dashboard">
        <div className="grid three">
          {[
            ["➕", "Add Crop", 6],
            ["📦", "My Crop Lots", 8],
            ["🤖", "AI Recommendations", 23],
            ["📊", "Market Intelligence", 18],
            ["🛒", "Orders", 39],
            ["💳", "Payments", 38],
            ["🔔", "Notifications", 16],
            ["👤", "Profile", 43],
          ].map(([icon, name, target]) => (
            <Card key={name}>
              <h2>{icon}</h2>
              <h3>{name}</h3>
              <Button onClick={() => go(target)}>Open</Button>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  // SCREEN 6
  if (screen === 6) {
    return (
      <Layout title="🌱 Smart Crop Listing">
        <Card className="form-card">
          <Input
            label="Crop Name"
            value={cropForm.crop}
            onChange={(e) =>
              setCropForm({ ...cropForm, crop: e.target.value })
            }
          />

          <Input
            label="Available Quantity (kg)"
            type="number"
            value={cropForm.quantity}
            onChange={(e) =>
              setCropForm({ ...cropForm, quantity: e.target.value })
            }
          />

          <Input
            label="Location"
            value={cropForm.location}
            onChange={(e) =>
              setCropForm({ ...cropForm, location: e.target.value })
            }
          />

          <Input
            label="Harvest Date"
            type="date"
            value={cropForm.harvest}
            onChange={(e) =>
              setCropForm({ ...cropForm, harvest: e.target.value })
            }
          />

          <Input
            label="Selling Availability Date"
            type="date"
            value={cropForm.available}
            onChange={(e) =>
              setCropForm({ ...cropForm, available: e.target.value })
            }
          />

          <Select
            label="Quality"
            value={cropForm.quality}
            onChange={(e) =>
              setCropForm({ ...cropForm, quality: e.target.value })
            }
          >
            <option>A Grade</option>
            <option>B Grade</option>
            <option>Mixed Grade</option>
          </Select>

          <Input
            label="Expected Price / kg"
            type="number"
            value={cropForm.price}
            onChange={(e) =>
              setCropForm({ ...cropForm, price: e.target.value })
            }
          />

          <Button
            className="secondary"
            onClick={() =>
              alert("🎤 Voice input demo: You can speak crop details here.")
            }
          >
            🎤 Voice Input
          </Button>

          <Button onClick={addCrop}>Save Crop & Continue</Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 7
  if (screen === 7) {
    return (
      <Layout title="📷 Crop Image & Preliminary Quality Assessment">
        <Card>
          <Input
            label="Upload Crop Image"
            type="file"
            accept="image/*"
          />
          <h3>Preliminary AI Assessment</h3>
          <p>Visible appearance: Good</p>
          <p>Uniformity: Good</p>
          <p>Possible visible defects: No major visible defect detected</p>
          <div className="warning">
            ⚠️ Preliminary AI assessment — physical verification may be
            required.
          </div>
          <Button onClick={() => go(8)}>View My Crop Lots</Button>
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
              <h3>{lot.crop}</h3>
              <p>Quantity: {lot.quantity} kg</p>
              <p>Location: {lot.location}</p>
              <p>Status: {lot.status}</p>
              <p>Buyer Interest: Active</p>
              <p>Aggregation Requests: Available</p>
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
    return (
      <Layout title="🏢 Buyer Dashboard">
        <div className="grid three">
          {[
            ["🛒", "Create Requirement", 10],
            ["🔍", "Find Crops / Supply", 11],
            ["📋", "My Requirements", 14],
            ["📦", "Orders", 36],
            ["💳", "Transactions", 38],
            ["🔔", "Notifications", 13],
            ["👤", "Profile", 43],
          ].map(([icon, name, target]) => (
            <Card key={name}>
              <h2>{icon}</h2>
              <h3>{name}</h3>
              <Button onClick={() => go(target)}>Open</Button>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  // SCREEN 10
  if (screen === 10) {
    return (
      <Layout title="🛒 Create Buyer Requirement">
        <Card className="form-card">
          {[
            ["Required Crop", "crop", "text"],
            ["Required Quantity (kg)", "quantity", "number"],
            ["Delivery Location", "location", "text"],
            ["Required Date", "date", "date"],
            ["Preferred Price Range", "price", "text"],
          ].map(([label, key, type]) => (
            <Input
              key={key}
              label={label}
              type={type}
              value={requirement[key]}
              onChange={(e) =>
                setRequirement({
                  ...requirement,
                  [key]: e.target.value,
                })
              }
            />
          ))}

          <Select
            label="Quality Requirement"
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

          <Button onClick={() => go(11)}>Create Demand Request</Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 11
  if (screen === 11) {
    return (
      <Layout title="🔍 Available Supply & Crop Search">
        <Card>
          <Input
            label="Search Crop"
            value={requirement.crop}
            onChange={(e) =>
              setRequirement({
                ...requirement,
                crop: e.target.value,
              })
            }
          />

          <p>Compatible Supply Found: {matches.length} lots</p>

          <div className="grid">
            {matches.map((lot) => (
              <Card key={lot.id}>
                <h3>{lot.crop}</h3>
                <p>{lot.quantity} kg</p>
                <p>{lot.location}</p>
                <p>{lot.quality}</p>
                <p>Available: {lot.available}</p>
                <Button
                  onClick={() => {
                    setSelectedLot(lot);
                    go(12);
                  }}
                >
                  View Details
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
          <h2>🍅 {selectedLot.crop}</h2>
          <p>Available Quantity: {selectedLot.quantity} kg</p>
          <p>Farmer/FPO: {selectedLot.farmer}</p>
          <p>Location: {selectedLot.location}</p>
          <p>Availability Date: {selectedLot.available}</p>
          <p>Quality: {selectedLot.quality}</p>
          <p>Preliminary quality information available.</p>
          <Button onClick={() => go(13)}>💬 Ask About This Crop</Button>
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
      <Layout title="💬 Buyer Crop Inquiry">
        <Card>
          <div className="quick-buttons">
            {quickQuestions.map((q) => (
              <Button
                key={q}
                className="secondary"
                onClick={() => sendQuestion(q)}
              >
                {q}
              </Button>
            ))}
          </div>

          <div className="messages">
            {messages.map((message, index) => (
              <p key={index} className={message.from === "Buyer" ? "buyer-msg" : "ai-msg"}>
                <strong>{message.from}: </strong>
                {message.text}
              </p>
            ))}
          </div>

          <Input
            label="Custom Question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about this crop..."
          />

          <Button onClick={() => sendQuestion()}>Send Question</Button>
          <Button className="secondary" onClick={() => go(14)}>
            Find Supply Match
          </Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 14
  if (screen === 14) {
    return (
      <Layout title="🤖 Opportunity Detection & Supply Matching">
        <Card>
          <h3>Buyer Requirement</h3>
          <p>
            {requirement.quantity} kg {requirement.crop}
          </p>

          <h3>AI Compatible Farmers</h3>

          {matches.map((lot) => (
            <p key={lot.id}>
              ✅ {lot.farmer}: {lot.quantity} kg — {lot.quality} —
              {lot.location}
            </p>
          ))}

          <p>
            <strong>Total Compatible Supply: {totalSupply} kg</strong>
          </p>

          <Button onClick={() => go(15)}>
            Build Aggregated Supply
          </Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 15
  if (screen === 15) {
    return (
      <Layout title="⭐ Dynamic AI Supply Aggregation">
        <Card>
          <h3>Buyer needs: {requirement.quantity} kg</h3>

          {matches.map((lot) => (
            <p key={lot.id}>
              {lot.farmer} → {lot.quantity} kg
            </p>
          ))}

          <h2>Aggregated Potential Supply = {totalSupply} kg</h2>

          <div className="warning">
            The system does not automatically commit farmers. Individual
            confirmation is required.
          </div>

          <Button onClick={() => go(16)}>
            Send Farmer Confirmation Requests
          </Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 16
  if (screen === 16) {
    return (
      <Layout title="🔔 Farmer Confirmation Request">
        <div className="grid">
          {matches.map((lot) => {
            const confirmed = confirmedIds.includes(lot.id);

            return (
              <Card key={lot.id}>
                <h3>{lot.farmer}</h3>
                <p>
                  A buyer requires {lot.quantity} kg of your {lot.crop}.
                </p>
                <p>Do you want to participate?</p>

                <Button
                  className={confirmed ? "success" : ""}
                  onClick={() => toggleConfirmation(lot.id)}
                >
                  {confirmed ? "✅ Accepted" : "✅ Accept"}
                </Button>

                <Button
                  className="danger"
                  onClick={() =>
                    setConfirmedIds((old) =>
                      old.filter((item) => item !== lot.id)
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

  // SCREEN 17
  if (screen === 17) {
    return (
      <Layout title="Quantity Gap Detection">
        <Card>
          <h2>Required: {requirement.quantity} kg</h2>
          <h2>Confirmed: {confirmedQuantity} kg</h2>
          <h2>Remaining: {remainingQuantity} kg</h2>

          {remainingQuantity > 0 ? (
            <>
              <div className="warning">
                AI searches additional compatible farmers, nearby supply and
                upcoming harvests.
              </div>
              <p>Additional potential supply available: {totalSupply - confirmedQuantity} kg</p>
            </>
          ) : (
            <div className="success-box">
              🎉 Full buyer quantity can be fulfilled.
            </div>
          )}

          <Button onClick={() => go(18)}>
            Continue to Market Intelligence
          </Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 18
  if (screen === 18) {
    return (
      <Layout title="📊 Market Intelligence Dashboard">
        <div className="grid three">
          <Card><h3>Current Mandi Price</h3><h2>₹24/kg</h2></Card>
          <Card><h3>Historical Trend</h3><h2>📈 +8%</h2></Card>
          <Card><h3>Arrival Volume</h3><h2>Medium</h2></Card>
          <Card><h3>Price Change</h3><h2>+₹2</h2></Card>
          <Card><h3>Last Updated</h3><h2>Demo Data</h2></Card>
        </div>
        <Button onClick={() => go(19)}>View Demand Intelligence</Button>
      </Layout>
    );
  }

  // SCREEN 19
  if (screen === 19) {
    return (
      <Layout title="🔮 Demand & Future Opportunity Intelligence">
        <div className="grid two">
          <Card>
            <h2>✅ Confirmed Demand</h2>
            <p>Actual buyer requirement: {requirement.quantity} kg {requirement.crop}</p>
          </Card>

          <Card>
            <h2>📊 Potential Demand</h2>
            <p>AI-estimated future opportunity based on seasonal patterns and market signals.</p>
          </Card>
        </div>
        <Button onClick={() => go(20)}>Next Crop Opportunity</Button>
      </Layout>
    );
  }

  // SCREEN 20
  if (screen === 20) {
    return (
      <Layout title="🌱 Next Crop Opportunity Insights">
        <Card>
          <h2>Suggested Opportunity: Tomato / Chilli</h2>
          <p>Based on seasonal patterns, demand, historical prices and market trends.</p>
          <div className="warning">
            ⚠️ Recommendation only — profit is not guaranteed.
          </div>
          <Button onClick={() => go(21)}>Analyze Net Return</Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 21
  if (screen === 21) {
    return (
      <Layout title="💰 Estimated Net Return Analysis">
        <Card>
          <p>Selling Value: ₹{estimatedSellingValue}</p>
          <p>− Transportation Cost: ₹{transportationCost}</p>
          <p>− Storage Cost: ₹{storageCost}</p>
          <p>− Handling Cost: ₹{handlingCost}</p>
          <hr />
          <h2>Estimated Net Return: ₹{estimatedNetReturn}</h2>
          <Button onClick={() => go(22)}>Calculate Opportunity Score</Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 22
  if (screen === 22) {
    return (
      <Layout title="📍 Opportunity Score">
        <Card>
          <div className="score">{opportunityScore}/100</div>
          <p>Based on estimated net return, demand, distance, logistics cost, quality compatibility, buyer reliability and transaction risk.</p>
          <Button onClick={() => go(23)}>View Top 3 Recommendations</Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 23
  if (screen === 23) {
    return (
      <Layout title="🏆 AI-Powered Top 3 Recommendations">
        <div className="grid">
          {recommendations.map((item) => (
            <Card key={item.rank}>
              <h2>
                {item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : "🥉"} {item.name}
              </h2>
              <p>Buyer: {item.buyer}</p>
              <p>Opportunity Score: {item.score}/100</p>
              <p>Estimated Net Return: ₹{item.net}</p>
              <p>Distance: {item.distance}</p>
              <p>Risk: {item.risk}</p>
            </Card>
          ))}
        </div>
        <Button onClick={() => go(24)}>Why is this recommended?</Button>
      </Layout>
    );
  }

  // SCREEN 24
  if (screen === 24) {
    return (
      <Layout title="🧾 Explainable AI">
        <Card>
          <h3>Why is this recommended?</h3>
          <ul>
            <li>Higher estimated net return</li>
            <li>Lower transportation cost</li>
            <li>Suitable quantity match</li>
            <li>Better reliability indicators</li>
            <li>Quality requirement matches</li>
            <li>Lower transaction risk</li>
          </ul>
          <Button onClick={() => go(25)}>Selling Decision Intelligence</Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 25
  if (screen === 25) {
    return (
      <Layout title="Sell / Wait / Store Intelligence">
        <div className="grid three">
          <Card className="selected">
            <h2>🟢 Sell Now</h2>
            <p>Strong current opportunity and lower storage risk.</p>
          </Card>
          <Card>
            <h2>🟡 Wait</h2>
            <p>Possible price improvement but with uncertainty.</p>
          </Card>
          <Card>
            <h2>🔵 Consider Storage</h2>
            <p>Only if storage cost and spoilage risk are acceptable.</p>
          </Card>
        </div>
        <Button onClick={() => go(26)}>Compare Storage</Button>
      </Layout>
    );
  }

  // SCREEN 26
  if (screen === 26) {
    return (
      <Layout title="Storage Feasibility Analysis">
        <div className="grid two">
          <Card>
            <h2>Sell Now</h2>
            <p>Estimated Return: ₹{estimatedNetReturn}</p>
          </Card>
          <Card>
            <h2>Store & Sell Later</h2>
            <p>Potential Price Increase: ₹4,000</p>
            <p>Storage Cost: ₹{storageCost}</p>
            <p>Spoilage Risk: Medium</p>
          </Card>
        </div>
        <Button onClick={() => go(27)}>View Scenarios</Button>
      </Layout>
    );
  }

  // SCREEN 27
  if (screen === 27) {
    return (
      <Layout title="📈 Scenario-Based Return Analysis">
        <div className="grid three">
          <Card><h2>Expected</h2><p>₹{estimatedNetReturn}</p></Card>
          <Card><h2>Better</h2><p>₹{estimatedNetReturn + 5000}</p></Card>
          <Card><h2>Risk</h2><p>₹{Math.max(0, estimatedNetReturn - 7000)}</p></Card>
        </div>
        <Button onClick={() => go(28)}>Logistics Analysis</Button>
      </Layout>
    );
  }

  // SCREEN 28
  if (screen === 28) {
    return (
      <Layout title="🚛 Logistics & Distance Analysis">
        <Card>
          <p>Buyer Delivery Location: {requirement.location}</p>
          <p>Estimated Distance: 18 km</p>
          <p>Delivery Date: {requirement.date}</p>
          <p>Estimated Transportation Cost: ₹{transportationCost}</p>
          <Button onClick={() => go(29)}>Choose Delivery Responsibility</Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 29
  if (screen === 29) {
    return (
      <Layout title="Delivery Responsibility">
        <div className="grid three">
          {["Buyer Pickup", "Farmer Delivery", "Logistics Provider"].map((mode) => (
            <Card key={mode} className={deliveryMode === mode ? "selected" : ""}>
              <h3>{mode}</h3>
              <Button onClick={() => setDeliveryMode(mode)}>Select</Button>
            </Card>
          ))}
        </div>
        <p>Selected: <strong>{deliveryMode}</strong></p>
        <Button onClick={() => go(30)}>Collection Point</Button>
      </Layout>
    );
  }

  // SCREEN 30
  if (screen === 30) {
    return (
      <Layout title="📦 Smart Collection Point">
        <Card>
          <h2>Multiple Farmers → Collection Point → Bulk Buyer</h2>
          <p>Suggested collection point: Kakinada Agricultural Hub</p>
          <p>Participating farmers: {confirmedLots.length}</p>
          <p>Confirmed quantity: {confirmedQuantity} kg</p>
          <Button onClick={() => go(31)}>Backup Logistics Plan</Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 31
  if (screen === 31) {
    return (
      <Layout title="Backup Logistics Planning">
        <div className="grid">
          <Card>🚚 Alternative Provider</Card>
          <Card>🚛 Buyer Pickup</Card>
          <Card>📦 Collection Point</Card>
          <Card>📅 Reschedule Delivery</Card>
        </div>
        <Button onClick={() => go(32)}>Check Buyer Reliability</Button>
      </Layout>
    );
  }

  // SCREEN 32
  if (screen === 32) {
    return (
      <Layout title="⭐ Buyer Reliability Profile">
        <Card>
          <p>Verification Status: Verified Demo Buyer</p>
          <p>Transaction History: Established History</p>
          <p>Payment Behaviour: Good</p>
          <p>Cancellation Pattern: Low</p>
          <div className="success-box">🟢 Established History</div>
          <Button onClick={() => go(33)}>Analyze Transaction Risk</Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 33
  if (screen === 33) {
    return (
      <Layout title="🚨 AI-Assisted Transaction Risk Detection">
        <Card>
          <p>Unusual Price: No</p>
          <p>Buyer Reliability: Good</p>
          <p>Quantity Match: Compatible</p>
          <p>Logistics Feasibility: Good</p>
          <p>Delivery Feasibility: Good</p>
          <div className="success-box">🟢 LOW RISK</div>
          <Button onClick={() => go(34)}>Check Data Confidence</Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 34
  if (screen === 34) {
    return (
      <Layout title="📊 Data Confidence Indicator">
        <Card>
          <div className="score">🟢 High Confidence</div>
          <p>Available listing, quantity, demand and market information are sufficient for this demo recommendation.</p>
          <p className="muted">If data is insufficient: “Insufficient data for a reliable recommendation.”</p>
          <Button onClick={() => go(35)}>View Offers</Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 35
  if (screen === 35) {
    return (
      <Layout title="💰 Offer Comparison & Negotiation">
        <div className="grid three">
          <Card><h3>Buyer A</h3><h2>₹25/kg</h2><p>Best Net Return</p></Card>
          <Card><h3>Buyer B</h3><h2>₹24/kg</h2><p>Lower Distance</p></Card>
          <Card><h3>Buyer C</h3><h2>₹26/kg</h2><p>Medium Risk</p></Card>
        </div>

        <Input
          label="Your Negotiated Price"
          type="number"
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
        />

        <Button onClick={() => go(36)}>
          Accept Offer ₹{offer}/kg
        </Button>
      </Layout>
    );
  }

  // SCREEN 36
  if (screen === 36) {
    return (
      <Layout title="Buyer Aggregated Supply Review">
        <Card>
          <p>Total Confirmed Quantity: {confirmedQuantity} kg</p>
          <p>Participating Farmers/FPOs: {confirmedLots.length}</p>
          <p>Crop: {requirement.crop}</p>
          <p>Quality Compatibility: Compatible</p>
          <p>Quantity Fulfilment: {confirmedQuantity >= requirement.quantity ? "Full" : "Partial"}</p>
          <p>Delivery Feasibility: Good</p>
          <Button onClick={() => go(37)}>Create Agreement</Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 37
  if (screen === 37) {
    return (
      <Layout title="📄 Digital Transaction Agreement">
        <Card>
          <p>Crop: {requirement.crop}</p>
          <p>Quantity: {confirmedQuantity} kg</p>
          <p>Price: ₹{offer}/kg</p>
          <p>Buyer: Demo Bulk Buyer</p>
          <p>Farmer/FPO: Participating Farmers</p>
          <p>Delivery Date: {requirement.date}</p>
          <p>Delivery Responsibility: {deliveryMode}</p>
          <p>Payment Terms: Payment after verification/delivery.</p>

          <Button onClick={() => go(38)}>
            Confirm Digital Agreement
          </Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 38
  if (screen === 38) {
    return (
      <Layout title="💳 Payment Tracking">
        <Card>
          <h2>{paymentStatus}</h2>

          <div className="progress">
            {["Payment Pending", "Payment Initiated", "Verification", "Payment Completed"].map(
              (item) => (
                <p key={item} className={paymentStatus === item ? "active-step" : ""}>
                  {item}
                </p>
              )
            )}
          </div>

          {paymentStatus !== "Payment Completed" && (
            <Button onClick={nextPayment}>Update Payment Status</Button>
          )}

          <Button className="secondary" onClick={() => go(39)}>
            View Order Tracking
          </Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 39
  if (screen === 39) {
    return (
      <Layout title="📦 Order & Delivery Tracking">
        <Card>
          <h2>{orderStatus}</h2>

          {[
            "Order Accepted",
            "Pickup Scheduled",
            "Collected",
            "In Transit",
            "Delivered",
            "Payment Completed",
          ].map((item) => (
            <p key={item} className={orderStatus === item ? "active-step" : ""}>
              {item}
            </p>
          ))}

          {orderStatus !== "Payment Completed" && (
            <Button onClick={nextOrder}>Update Order Status</Button>
          )}

          <Button className="secondary" onClick={() => go(40)}>
            Raise Dispute
          </Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 40
  if (screen === 40) {
    return (
      <Layout title="⚖️ Dispute & Grievance System">
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
          </Select>

          <Button
            onClick={() => {
              if (dispute) alert(`${dispute} raised successfully.`);
            }}
          >
            Raise Issue
          </Button>

          <p>Issue Raised → Under Review → Resolution Status</p>
          <Button onClick={() => go(41)}>Actual Outcome</Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 41
  if (screen === 41) {
    const actualReturn =
      Number(selectedLot.quantity) * Number(actualPrice) -
      Number(actualLogistics);

    return (
      <Layout title="Feedback & Actual Outcome">
        <Card className="form-card">
          <Input
            label="Actual Selling Price / kg"
            type="number"
            value={actualPrice}
            onChange={(e) => setActualPrice(e.target.value)}
          />

          <Input
            label="Actual Logistics Cost"
            type="number"
            value={actualLogistics}
            onChange={(e) => setActualLogistics(e.target.value)}
          />

          <p>Delivery Result: Completed</p>
          <hr />
          <p>Estimated Net Return: ₹{estimatedNetReturn}</p>
          <h2>Actual Net Return: ₹{actualReturn}</h2>

          <Button onClick={() => go(42)}>Update Recommendations</Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 42
  if (screen === 42) {
    return (
      <Layout title="🔄 Dynamic Recommendation Updates">
        <Card>
          <Button
            onClick={() => setMarketUpdated(true)}
          >
            Simulate Market Change
          </Button>

          {marketUpdated && (
            <div className="warning">
              ⚠️ Market conditions have changed. Recommendations updated.
              <p>Opportunity Score updated.</p>
              <p>Top 3 ranking updated.</p>
              <p>Net return estimate updated.</p>
              <p>Risk level updated.</p>
            </div>
          )}

          <Button onClick={() => go(43)}>Offline Support</Button>
        </Card>
      </Layout>
    );
  }

  // SCREEN 43
  if (screen === 43) {
    return (
      <Layout title="📡 Low Internet / Offline Support">
        <Card>
          <p>Current Mode: {online ? "Online" : "Offline"}</p>
          <p>Pending actions can be saved locally.</p>
          <p>Previously loaded information remains visible.</p>
          <p>Data sync can happen when internet returns.</p>

          <Button onClick={() => setOnline(!online)}>
            {online ? "Simulate Offline Mode" : "Restore Internet"}
          </Button>

          <Button className="secondary" onClick={() => go(44)}>
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
        <h3>If market data fails</h3>
        <p>Show last verified data and timestamp.</p>

        <h3>If AI confidence is low</h3>
        <p>Insufficient data for a reliable recommendation.</p>

        <h3>If payment verification fails</h3>
        <p>Transaction Pending Verification</p>

        <div className="success-box">
          🎉 All 44 app screens are available in this prototype.
        </div>

        <Button onClick={() => go(5)}>
          Return to Farmer Dashboard
        </Button>
        <Button className="secondary" onClick={() => go(9)}>
          Open Buyer Dashboard
        </Button>
      </Card>
    </Layout>
  );
}

export default App;