// --------------------------------------------
// DELGROSSO VIAGGI & LIMOUSINE BUS
// Sistema Prenotazioni GT - Versione Ottimizzata
// Design: Light Mode - Moderno, senza Tailwind
// --------------------------------------------

import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

// Import logo
import logo from "./assets/logo.png";

// --------------------------------------------
// Funzioni utili
// --------------------------------------------

function generateSeats(total) {
  const rows = [];
  let num = 1;

  while (num <= total) {
    const row = [];

    // 4 posti per riga (2 + corridoio + 2)
    for (let i = 0; i < 4 && num <= total; i++) {
      row.push({ id: num, label: String(num) });
      num++;
    }
    rows.push(row);
  }

  return rows;
}

// Componente grafico per ogni posto
function Seat({ seat, booked, selected, onClick }) {
  if (!seat) return <div className="seat empty"></div>;

  let cls = "seat";
  if (booked) cls += " booked";
  else if (selected) cls += " active";

  return (
    <div className={cls} onClick={() => !booked && onClick(seat.id)}>
      {seat.label}
    </div>
  );
}

// --------------------------------------------
// COMPONENTE PRINCIPALE
// --------------------------------------------
export default function App() {
  const [busType, setBusType] = useState("53");
  const [layout, setLayout] = useState(generateSeats(53));

  const [bookings, setBookings] = useState([]);
  const [trips, setTrips] = useState([]);

  const [selectedSeat, setSelectedSeat] = useState(null);

  const [form, setForm] = useState({
    nome: "",
    cognome: "",
    telefono: "",
    partenza: "",
    dataPartenza: "",
    destinazione: ""
  });

  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingTrips, setLoadingTrips] = useState(false);

  const [message, setMessage] = useState("");

  // Admin
  const [adminMode, setAdminMode] = useState(false);
  const ADMIN_PASSWORD = "DEL2025BUS";
  const [adminInput, setAdminInput] = useState("");

  const capacity = busType === "53" ? 53 : 63;
  const isFull = bookings.length >= capacity;

  // Layout bus cambia quando si cambia tipo bus
  useEffect(() => {
    setLayout(generateSeats(Number(busType)));
    setSelectedSeat(null);
  }, [busType]);

  // --------------------------------------------
  // RENDER del layout principale
  // --------------------------------------------

  return (
    <div className="page">

      {/* HEADER */}
      <header className="header">
        <div className="header-left">
          <img src={logo} alt="Logo DelGrosso" className="logo" />
          <div>
            <h1 className="title">DELGROSSO VIAGGI & LIMOUSINE BUS</h1>
            <p className="subtitle">Gestione prenotazioni Bus GT</p>
          </div>
        </div>

        <div className="header-right">
          <label className="lbl">Tipo Bus:</label>
          <select
            className="input"
            value={busType}
            onChange={(e) => setBusType(e.target.value)}
          >
            <option value="53">GT 53 posti</option>
            <option value="63">GT 63 posti</option>
          </select>

          {!adminMode ? (
            <div className="admin-login">
              <input
                className="input small"
                type="password"
                placeholder="Password admin"
                value={adminInput}
                onChange={(e) => setAdminInput(e.target.value)}
              />
              <button
                className="btn small"
                onClick={() => {
                  if (adminInput === ADMIN_PASSWORD) {
                    setAdminMode(true);
                    setAdminInput("");
                  } else alert("Password errata");
                }}
              >
                Entra
              </button>
            </div>
          ) : (
            <div className="admin-online">Modalità Admin attiva</div>
          )}
        </div>
      </header>

      {/* MESSAGGI */}
      {message && (
        <div className="message">
          {message}
        </div>
      )}

      {/* CONTENUTO */}
      <div className="content">

        {/* Qui verranno inserite le prossime sezioni */}
        {/* Piantina, Form prenotazione, Mete, Admin, ecc. */}

      </div>
    </div>
  );
}
