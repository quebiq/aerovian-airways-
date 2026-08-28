
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const PUBLIC_DIR = path.join(ROOT, "public");

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const files = {
  bookings: path.join(DATA_DIR, "bookings.json"),
  messages: path.join(DATA_DIR, "messages.json"),
  subscribers: path.join(DATA_DIR, "subscribers.json")
};

for (const file of Object.values(files)) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, "[]");
}

const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const write = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

const airports = {
  JNB: "Johannesburg O.R. Tambo International Airport",
  AUH: "Abu Dhabi International Airport",
  CPT: "Cape Town International Airport",
  LOS: "Lagos Murtala Muhammed International Airport",
  ADD: "Addis Ababa Bole International Airport",
  DXB: "Dubai International Airport",
  LHR: "London Heathrow Airport",
  DUR: "King Shaka International Airport",
  PLZ: "Chief Dawid Stuurman International Airport",
  GBE: "Sir Seretse Khama International Airport"
};

const routes = [
  ["JNB","CPT"], ["JNB","DUR"], ["JNB","PLZ"], ["CPT","DUR"], ["CPT","GBE"],
  ["JNB","LOS"], ["JNB","ADD"], ["JNB","DXB"], ["JNB","LHR"], ["LOS","LHR"]
];

const fleet = [
  { model: "Embraer ERJ190-100AR", seats: 85, business: 8, first: 3, role: "Regional & short/medium haul" },
  { model: "Airbus A320-200", seats: 130, business: 19, first: 6, role: "Short/medium haul" },
  { model: "Boeing 737-800", seats: 102, business: 22, first: 12, role: "Short/medium haul" }
];

app.get("/api/health", (req, res) => {
  res.json({ ok: true, airline: "Aerovian Airways", timestamp: new Date().toISOString() });
});

app.get("/api/config", (req, res) => {
  res.json({
    airline: "Aerovian Airways",
    slogan: "Connecting Africa, Beyond Our Sky",
    hubs: [
      { code: "JNB", name: airports.JNB, base: true },
      { code: "AUH", name: airports.AUH, base: false },
      { code: "CPT", name: airports.CPT, base: false }
    ],
    fleet
  });
});

app.get("/api/flights/search", (req, res) => {
  const from = String(req.query.from || "").toUpperCase();
  const to = String(req.query.to || "").toUpperCase();
  const date = String(req.query.date || "");

  if (!from || !to || from === to) {
    return res.status(400).json({ error: "Please choose two different airports." });
  }

  const validRoute = routes.some(([a,b]) => a === from && b === to);
  const reverseRoute = routes.some(([a,b]) => a === to && b === from);

  if (!validRoute && !reverseRoute) {
    return res.json({ results: [], message: "No Aerovian service is scheduled for this city pair yet." });
  }

  const seed = (from.charCodeAt(0) + to.charCodeAt(0) + (date || "today").length) % 3;
  const aircraft = fleet[seed];
  const flightNo = `AV${200 + seed * 17 + from.charCodeAt(0)}`;
  const baseFare = 129 + seed * 47;

  res.json({
    results: [{
      id: crypto.randomUUID(),
      flightNo,
      airline: "Aerovian Airways",
      from,
      to,
      fromName: airports[from] || from,
      toName: airports[to] || to,
      date: date || null,
      depart: "08:20",
      arrive: "10:35",
      duration: "2h 15m",
      aircraft: aircraft.model,
      fare: baseFare,
      currency: "USD",
      seatsLeft: 7 + seed * 5
    }]
  });
});

app.post("/api/bookings", (req, res) => {
  const { firstName, lastName, email, from, to, date, passengers = 1, flightNo } = req.body || {};
  if (!firstName || !lastName || !email || !from || !to || !date) {
    return res.status(400).json({ error: "Please complete all required booking fields." });
  }

  const bookings = read(files.bookings);
  const booking = {
    reference: `AV${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
    firstName, lastName, email, from, to, date,
    passengers: Number(passengers),
    flightNo: flightNo || "AV201",
    status: "CONFIRMED",
    createdAt: new Date().toISOString()
  };
  bookings.push(booking);
  write(files.bookings, bookings);

  res.status(201).json({
    message: "Booking created successfully.",
    booking
  });
});

app.post("/api/contact", (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email and message are required." });
  }

  const messages = read(files.messages);
  messages.push({
    id: crypto.randomUUID(),
    name, email,
    subject: subject || "General enquiry",
    message,
    createdAt: new Date().toISOString()
  });
  write(files.messages, messages);

  res.status(201).json({ message: "Thank you. Your message has been received." });
});

app.post("/api/newsletter", (req, res) => {
  const { email } = req.body || {};
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  const subscribers = read(files.subscribers);
  if (!subscribers.some(x => x.email.toLowerCase() === email.toLowerCase())) {
    subscribers.push({ email, subscribedAt: new Date().toISOString() });
    write(files.subscribers, subscribers);
  }
  res.status(201).json({ message: "You're subscribed to Aerovian updates." });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Aerovian Airways website running at http://localhost:${PORT}`);
});
