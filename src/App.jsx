i// ==============================================
// DELGROSSO VIAGGI & LIMOUSINE BUS
// SISTEMA COMPLETO PRENOTAZIONI GT
// Versione: Professionale Light Mode
// ==============================================

import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import logo from "./assets/logo.png";

// --------------------------------------------------
// UTILS
// --------------------------------------------------
function generateSeats(total) {
  const rows = [];
  let n = 1;
  while (n <= total) {
    const row = [];
    for (let i = 0; i < 4 && n <= total; i++) {
      row.push({ id: n, label: String(n) });
      n++;
    }
    rows.push(row);
  }
  return rows;
}

function Seat({ seat, booked, selected, onClick }) {
  if (!seat) return <div className="seat empty"></div>;

  let cls = "seat";
  if (booked) cls += " booked";
  else if (selected) cls += " selected";

  return (
    <div className={cls} onClick={() => !booked && onClick(seat.id)}>
      {seat.label}
    </div>
  );
}

// --------------------------------------------------
// COMPONENTE PRINCIPALE
// --------------------------------------------------
export default function App() {
  const ADMIN_PASSWORD = "DEL2025BUS";

  // stati base
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

  // admin
  const [adminMode, setAdminMode] = useState(false);
  const [adminInput, setAdminInput] = useState("");

  const capacity = busType === "53" ? 53 : 63;

  // --------------------------------------------------
  // CARICAMENTO PRENOTAZIONI
  // --------------------------------------------------
  async function loadBookings() {
    setLoadingBookings(true);
    setMessage("");

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("busType", String(busType))
      .order("seat", { ascending: true });

    if (error) {
      console.error(error);
      setMessage("Errore nel caricamento delle prenotazioni.");
    } else {
      setBookings(data);
    }

    setLoadingBookings(false);
  }

  // --------------------------------------------------
  // CARICAMENTO METE (TRIPS)
  // --------------------------------------------------
  async function loadTrips() {
    setLoadingTrips(true);

    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.error(error);
      setMessage("Errore nel caricamento delle mete.");
    } else {
      setTrips(data);

      // imposta meta default
      if (data.length > 0 && !form.destinazione) {
        setForm((f) => ({ ...f, destinazione: data[0].name }));
      }
    }

    setLoadingTrips(false);
  }

  // --------------------------------------------------
  // EFFETTI INIZIALI
  // --------------------------------------------------
  useEffect(() => {
    loadBookings();
  }, [busType]);

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    setLayout(generateSeats(Number(busType)));
    setSelectedSeat(null);
  }, [busType]);

  // --------------------------------------------------
  // SELEZIONE POSTO
  // --------------------------------------------------
  function selectSeat(id) {
    const isBooked = bookings.some((b) => Number(b.seat) === Number(id));
    if (isBooked) return;

    setSelectedSeat((prev) => (prev === id ? null : id));
  }

  // --------------------------------------------------
  // SALVA PRENOTAZIONE
  // --------------------------------------------------
  async function saveBooking() {
    setMessage("");

    if (!selectedSeat) {
      alert("Seleziona un posto.");
      return;
    }

    if (!form.nome || !form.cognome || !form.telefono || !form.partenza) {
      alert("Compila tutti i campi.");
      return;
    }

    if (!form.dataPartenza) {
      alert("Inserisci la data del viaggio.");
      return;
    }

    const payload = {
      seat: selectedSeat,
      nome: form.nome,
      cognome: form.cognome,
      telefono: form.telefono,
      partenza: form.partenza,
      data_partenza: form.dataPartenza,
      destinazione: form.destinazione,
      busType: String(busType)
    };

    const { error } = await supabase.from("bookings").insert(payload);

    if (error) {
      console.error(error);
      setMessage("Errore nel salvataggio della prenotazione.");
      return;
    }

    setMessage("Prenotazione salvata correttamente!");
    setSelectedSeat(null);
    setForm({
      nome: "",
      cognome: "",
      telefono: "",
      partenza: "",
      dataPartenza: "",
      destinazione: trips.length > 0 ? trips[0].name : ""
    });

    loadBookings();
  }

  // --------------------------------------------------
  // CANCELLA PRENOTAZIONE
  // --------------------------------------------------
  async function cancelBooking(id) {
    if (!window.confirm("Vuoi eliminare questa prenotazione?")) return;

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setMessage("Errore nell'eliminare la prenotazione.");
      return;
    }

    setMessage("Prenotazione eliminata.");
    loadBookings();
  }

  // --------------------------------------------------
  // WHATSAPP PER SINGOLA PRENOTAZIONE
  // --------------------------------------------------
  function sendWhatsapp(booking) {
    const phone = String(booking.telefono || "").replace(/\D/g, "");
    if (!phone) {
      alert("Numero telefono non valido per WhatsApp.");
      return;
    }

    const dataPartenzaText = booking.data_partenza
      ? new Date(booking.data_partenza).toLocaleDateString("it-IT")
      : "";

    const msg = encodeURIComponent(
      `Ciao ${booking.nome} ${booking.cognome}, la tua prenotazione per il viaggio ${booking.destinazione} del ${dataPartenzaText}, posto ${booking.seat}, è registrata da Delgrosso Viaggi & Limousine Bus.`
    );

    const url = `https://wa.me/${phone}?text=${msg}`;
    window.open(url, "_blank");
  }

  // --------------------------------------------------
  // STAMPA LISTA (usa stampa browser)
  // --------------------------------------------------
  function printList() {
    window.print();
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <div className="page">

      {/* HEADER */}
      <header className="header">
        <div className="header-left">
          <img src={logo} alt="Logo DelGrosso" className="logo" />
          <div>
            <h1 className="title">DELGROSSO VIAGGI & LIMOUSINE BUS</h1>
            <p className="subtitle">Sistema completo prenotazioni GT</p>
          </div>
        </div>

        <div className="header-right">

          <div className="bus-selector">
            <label>Tipo Bus:</label>
            <select
              value={busType}
              onChange={(e) => setBusType(e.target.value)}
            >
              <option value="53">GT 53 Posti</option>
              <option value="63">GT 63 Posti</option>
            </select>
          </div>

          {!adminMode ? (
            <div className="admin-login">
              <input
                type="password"
                placeholder="Password admin"
                value={adminInput}
                onChange={(e) => setAdminInput(e.target.value)}
              />
              <button
                onClick={() => {
                  if (adminInput === ADMIN_PASSWORD) {
                    setAdminMode(true);
                    setAdminInput("");
                    setMessage("Accesso amministratore eseguito.");
                  } else {
                    alert("Password errata.");
                  }
                }}
              >
                Entra
              </button>
            </div>
          ) : (
            <div className="admin-badge">Admin attivo</div>
          )}

        </div>
      </header>

      {/* MESSAGGIO UTENTE */}
      {message && <div className="message">{message}</div>}

      {/* CONTENUTO PRINCIPALE */}
      <main className="main-content">

        {/* PIANTINA BUS */}
        <section className="section">
          <h2 className="section-title">
            Piantina posti — Bus {busType} posti
          </h2>

          {loadingBookings && (
            <p className="loading">Caricamento prenotazioni…</p>
          )}

          <div className="bus-map">
            {layout.map((row, i) => (
              <div className="bus-row" key={i}>
                <Seat
                  seat={row[0]}
                  booked={
                    !!row[0] &&
                    bookings.some((b) => Number(b.seat) === row[0].id)
                  }
                  selected={selectedSeat === row[0]?.id}
                  onClick={selectSeat}
                />
                <Seat
                  seat={row[1]}
                  booked={
                    !!row[1] &&
                    bookings.some((b) => Number(b.seat) === row[1].id)
                  }
                  selected={selectedSeat === row[1]?.id}
                  onClick={selectSeat}
                />

                <div className="aisle"></div>

                <Seat
                  seat={row[2]}
                  booked={
                    !!row[2] &&
                    bookings.some((b) => Number(b.seat) === row[2].id)
                  }
                  selected={selectedSeat === row[2]?.id}
                  onClick={selectSeat}
                />
                <Seat
                  seat={row[3]}
                  booked={
                    !!row[3] &&
                    bookings.some((b) => Number(b.seat) === row[3].id)
                  }
                  selected={selectedSeat === row[3]?.id}
                  onClick={selectSeat}
                />
              </div>
            ))}
          </div>

          <div className="legend">
            <div className="legend-item">
              <span className="seat free"></span> Libero
            </div>
            <div className="legend-item">
              <span className="seat selected"></span> Selezionato
            </div>
            <div className="legend-item">
              <span className="seat booked"></span> Occupato
            </div>
          </div>
        </section>

        {/* FORM PRENOTAZIONE */}
        <section className="section form-section">
          <h2 className="section-title">Prenota Posto</h2>

          <div className="form-grid">

            <div className="form-group">
              <label>Posto selezionato</label>
              <input value={selectedSeat || "Nessun posto"} disabled />
            </div>

            <div className="form-group">
              <label>Nome</label>
              <input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Cognome</label>
              <input
                value={form.cognome}
                onChange={(e) => setForm({ ...form, cognome: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Telefono</label>
              <input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Luogo di partenza</label>
              <input
                value={form.partenza}
                onChange={(e) => setForm({ ...form, partenza: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Data di partenza</label>
              <input
                type="date"
                value={form.dataPartenza}
                onChange={(e) =>
                  setForm({ ...form, dataPartenza: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Meta viaggio</label>
              <select
                value={form.destinazione}
                onChange={(e) =>
                  setForm({ ...form, destinazione: e.target.value })
                }
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} {t.date && `(${t.date})`}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn primary" onClick={saveBooking}>
              Conferma Prenotazione
            </button>

          </div>
        </section>

        {/* LISTA PRENOTAZIONI */}
        <section className="section">
          <h2 className="section-title">
            Prenotazioni ({bookings.length}) — Bus {busType}
          </h2>

          {adminMode && bookings.length > 0 && (
            <button className="btn" onClick={printList}>
              Stampa lista partecipanti
            </button>
          )}

          <div className="booking-list">
            {bookings.map((b) => (
              <div className="booking-card" key={b.id}>
                <div className="booking-main">
                  <strong>
                    Posto {b.seat}: {b.nome} {b.cognome}
                  </strong>
                  <p>
                    {b.partenza} → {b.destinazione}
                  </p>
                  <p>Tel: {b.telefono}</p>
                  {b.data_partenza && (
                    <p>
                      Data:{" "}
                      {new Date(b.data_partenza).toLocaleDateString("it-IT")}
                    </p>
                  )}
                </div>

                <div className="booking-actions">
                  <button
                    className="btn whatsapp small"
                    onClick={() => sendWhatsapp(b)}
                  >
                    WhatsApp
                  </button>

                  {adminMode && (
                    <button
                      className="btn danger small"
                      onClick={() => cancelBooking(b.id)}
                    >
                      Cancella
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AREA ADMIN: METE */}
        {adminMode && (
          <section className="section">
            <h2 className="section-title">Gestione Mete</h2>

            {/* Lista mete */}
            <div className="trip-list">
              {trips.map((t) => (
                <div key={t.id} className="trip-card">
                  <div>
                    <strong>{t.name}</strong>
                    {t.date && (
                      <span className="trip-date"> — {t.date}</span>
                    )}
                  </div>

                  <div className="trip-actions">
                    <button
                      className="btn small"
                      onClick={async () => {
                        const name = prompt(
                          "Nuovo nome meta:",
                          t.name
                        );
                        if (!name) return;

                        const date = prompt(
                          "Nuova data (YYYY-MM-DD):",
                          t.date
                        );
                        if (!date) return;

                        const { error } = await supabase
                          .from("trips")
                          .update({ name, date })
                          .eq("id", t.id);

                        if (error) {
                          alert("Errore modifica meta");
                        } else {
                          loadTrips();
                        }
                      }}
                    >
                      Modifica
                    </button>

                    <button
                      className="btn danger small"
                      onClick={async () => {
                        if (!window.confirm("Eliminare questa meta?"))
                          return;

                        const { error } = await supabase
                          .from("trips")
                          .delete()
                          .eq("id", t.id);

                        if (error) {
                          alert("Errore eliminazione meta");
                        } else {
                          loadTrips();
                        }
                      }}
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Aggiungi meta */}
            <button
              className="btn primary"
              onClick={async () => {
                const nome = prompt("Nome nuova meta:");
                if (!nome) return;

                const data = prompt("Data viaggio (YYYY-MM-DD):");
                if (!data) return;

                const { error } = await supabase
                  .from("trips")
                  .insert({ name: nome, date: data });

                if (error) {
                  alert("Errore aggiunta meta");
                } else {
                  loadTrips();
                }
              }}
            >
              ➕ Aggiungi Meta
            </button>
          </section>
        )}

      </main>
    </div>
  );
}
