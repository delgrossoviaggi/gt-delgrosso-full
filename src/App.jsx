import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

/**
 * DELGROSSO VIAGGI & LIMOUSINE BUS
 * Gestionale prenotazioni Bus GT (53 / 63 posti)
 * + Area riservata admin (gestione mete + lista partecipanti)
 */

// ---------- Helpers ----------

function generateSeats(totalSeats) {
  const seats = [];
  let n = 1;
  while (n <= totalSeats) {
    const row = [null, null, null, null]; // 2 + corridoio + 2
    for (let i = 0; i < 4 && n <= totalSeats; i++) {
      row[i] = { id: n, label: String(n) };
      n++;
    }
    seats.push(row);
  }
  return seats;
}

function Seat({ seat, status, onClick }) {
  if (!seat) return <div className="w-10 h-10" />;

  const base =
    "w-10 h-10 flex items-center justify-center rounded-md text-xs sm:text-sm cursor-pointer border transition";
  const cls =
    status === "booked"
      ? base +
        " bg-gray-300 border-gray-400 text-gray-700 cursor-not-allowed line-through"
      : status === "selected"
      ? base + " bg-emerald-500 text-white border-emerald-700 shadow"
      : base + " bg-white border-gray-300 hover:shadow";

  return (
    <div
      className={cls}
      onClick={() => status !== "booked" && onClick(seat.id)}
    >
      {seat.label}
    </div>
  );
}

// ---------- Component ----------

export default function App() {
  // Password area riservata
  const ADMIN_PASSWORD = "DEL2025BUS"; // cambiala come vuoi

  // stato base
  const [busType, setBusType] = useState("53");
  const [seatsLayout, setSeatsLayout] = useState(() => generateSeats(53));

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  const [selectedSeat, setSelectedSeat] = useState(null);

  const [form, setForm] = useState({
    nome: "",
    cognome: "",
    telefono: "",
    partenza: "",
    dataPartenza: "",
    destinazione: "",
  });

  const [message, setMessage] = useState("");

  // area riservata
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState("");

  // capacità bus & stato pieno
  const capacity = busType === "53" ? 53 : 63;
  const isBusFull = bookings.length >= capacity;

  // ---------- EFFECTS ----------

  useEffect(() => {
    setSeatsLayout(generateSeats(Number(busType)));
    setSelectedSeat(null);
  }, [busType]);

  useEffect(() => {
    loadBookings(busType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busType]);

  useEffect(() => {
    async function loadTrips() {
      try {
        setLoadingTrips(true);
        const { data, error } = await supabase
          .from("trips")
          .select("*")
          .order("date", { ascending: true });

        if (error) {
          console.error("Supabase error (trips):", error.message);
          setMessage("Errore nel caricare le mete.");
          return;
        }

        setTrips(data || []);

        if ((data || []).length > 0) {
          setForm((f) => ({
            ...f,
            destinazione: f.destinazione || data[0].name,
          }));
        }
      } catch (err) {
        console.error(err);
        setMessage("Errore nel caricare le mete.");
      } finally {
        setLoadingTrips(false);
      }
    }

    loadTrips();
  }, []);

  // ---------- FUNZIONI PRENOTAZIONI ----------

  async function loadBookings(currentBusType) {
    try {
      setLoadingBookings(true);
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("busType", String(currentBusType))
        .order("seat", { ascending: true });

      if (error) {
        console.error("Supabase error (bookings load):", error.message);
        setMessage("Errore nel caricare le prenotazioni.");
        return;
      }

      setBookings(data || []);
    } catch (err) {
      console.error(err);
      setMessage("Errore nel caricare le prenotazioni.");
    } finally {
      setLoadingBookings(false);
    }
  }

  function isSeatBooked(id) {
    return bookings.some((b) => Number(b.seat) === Number(id));
  }

  function handleSeatClick(id) {
    if (isSeatBooked(id)) return;
    setSelectedSeat((prev) => (prev === id ? null : id));
  }

  async function handleBook() {
    setMessage("");

    if (!selectedSeat) {
      alert("Seleziona prima un posto sul bus.");
      return;
    }
    if (!form.nome || !form.cognome || !form.telefono || !form.partenza) {
      alert("Compila tutti i campi obbligatori.");
      return;
    }
    if (!form.dataPartenza) {
      alert("Inserisci la data di partenza.");
      return;
    }
    if (!form.destinazione) {
      alert("Seleziona una meta di viaggio.");
      return;
    }

    const already = bookings.some(
      (b) => Number(b.seat) === Number(selectedSeat)
    );
    if (already) {
      alert("Questo posto è già prenotato. Aggiorna la pagina.");
      await loadBookings(busType);
      return;
    }

    try {
      const payload = {
        seat: selectedSeat,
        nome: form.nome,
        cognome: form.cognome,
        telefono: form.telefono,
        partenza: form.partenza,
        data_partenza: form.dataPartenza,
        destinazione: form.destinazione,
        busType: String(busType),
      };

      console.log("Inserisco prenotazione:", payload);

      const { error } = await supabase.from("bookings").insert(payload);

      if (error) {
        console.error("Supabase error (insert):", error.message);
        setMessage("Errore Supabase: " + error.message);
        return;
      }

      setMessage("Prenotazione salvata con successo!");
      setSelectedSeat(null);
      setForm((f) => ({
        ...f,
        nome: "",
        cognome: "",
        telefono: "",
        partenza: "",
        dataPartenza: "",
      }));
      await loadBookings(busType);
    } catch (err) {
      console.error("Errore JS:", err);
      setMessage("Errore nel salvare la prenotazione.");
    }
  }

  async function handleCancelBooking(id) {
    if (!window.confirm("Vuoi annullare questa prenotazione?")) return;
    try {
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) {
        console.error("Supabase error (delete):", error.message);
        setMessage("Errore Supabase: " + error.message);
        return;
      }
      setMessage("Prenotazione annullata.");
      await loadBookings(busType);
    } catch (err) {
      console.error(err);
      setMessage("Errore nell'annullare la prenotazione.");
    }
  }

  // ---------- FUNZIONI METE (trips) ----------

  async function addTrip() {
    const name = window.prompt("Nuova meta (es. Milano):");
    if (!name) return;
    const date = window.prompt(
      'Data viaggio (formato "YYYY-MM-DD", es. 2025-12-31):'
    );
    if (!date) return;

    try {
      const { error } = await supabase.from("trips").insert({ name, date });
      if (error) {
        console.error("Supabase error (trip insert):", error.message);
        setMessage("Errore Supabase: " + error.message);
        return;
      }
      setMessage("Meta aggiunta.");
      const { data } = await supabase
        .from("trips")
        .select("*")
        .order("date", { ascending: true });
      setTrips(data || []);
    } catch (err) {
      console.error(err);
      setMessage("Errore nell'aggiungere la meta.");
    }
  }

  async function editTrip(trip) {
    const name = window.prompt("Modifica meta:", trip.name);
    if (!name) return;
    const date = window.prompt(
      'Modifica data (YYYY-MM-DD):',
      trip.date || ""
    );
    if (!date) return;

    try {
      const { error } = await supabase
        .from("trips")
        .update({ name, date })
        .eq("id", trip.id);
      if (error) {
        console.error("Supabase error (trip update):", error.message);
        setMessage("Errore Supabase: " + error.message);
        return;
      }
      setMessage("Meta aggiornata.");
      const { data } = await supabase
        .from("trips")
        .select("*")
        .order("date", { ascending: true });
      setTrips(data || []);
    } catch (err) {
      console.error(err);
      setMessage("Errore nel modificare la meta.");
    }
  }

  async function removeTrip(trip) {
    if (!window.confirm(`Eliminare la meta "${trip.name}"?`)) return;
    try {
      const { error } = await supabase
        .from("trips")
        .delete()
        .eq("id", trip.id);
      if (error) {
        console.error("Supabase error (trip delete):", error.message);
        setMessage("Errore Supabase: " + error.message);
        return;
      }
      setMessage("Meta eliminata.");
      setTrips((ts) => ts.filter((t) => t.id !== trip.id));
    } catch (err) {
      console.error(err);
      setMessage("Errore nell'eliminare la meta.");
    }
  }

  // ---------- AREA RISERVATA ----------

  function handleAdminLogin() {
    if (adminPassInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setAdminPassInput("");
      setMessage("Accesso area riservata effettuato.");
    } else {
      alert("Password errata.");
    }
  }

  // ---------- RENDER ----------

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-slate-50">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-md p-4 sm:p-6">
        {/* HEADER */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-4">
            <img
              src="/delgrosso-logo.png"
              alt="DelGrosso Viaggi & Limousine Bus"
              className="h-16 object-contain"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold">
                DELGROSSO VIAGGI &amp; LIMOUSINE BUS
              </h1>
              <p className="text-sm text-slate-500">
                Gestionale prenotazioni posti Bus GT
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span>Tipo bus:</span>
              <select
                value={busType}
                onChange={(e) => setBusType(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="53">GT 53 posti</option>
                <option value="63">GT 63 posti</option>
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Prenotazioni su Supabase (tabella <code>bookings</code>).
            </div>

            {!isAdmin ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="password"
                  placeholder="Password admin"
                  value={adminPassInput}
                  onChange={(e) => setAdminPassInput(e.target.value)}
                  className="border rounded px-2 py-1 text-xs"
                />
                <button
                  onClick={handleAdminLogin}
                  className="px-2 py-1 rounded bg-slate-800 text-white text-xs"
                >
                  Entra
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                Area riservata attiva
              </div>
            )}
          </div>
        </header>

        {message && (
          <div className="mb-4 text-xs px-3 py-2 rounded bg-amber-50 border border-amber-200 text-amber-800">
            {message}
          </div>
        )}

        {/* MAIN */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Piantina + form */}
          <section className="lg:col-span-2">
            <h2 className="font-semibold mb-2">
              Piantina posti — Bus GT {busType} posti
            </h2>

            <div className="bg-slate-50 border rounded-xl p-4">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Piantina */}
                <div className="flex-1">
                  {loadingBookings && (
                    <div className="text-xs text-slate-500 mb-2">
                      Carico prenotazioni...
                    </div>
                  )}
                  <div className="grid gap-2">
                    {seatsLayout.map((row, rIndex) => (
                      <div
                        key={rIndex}
                        className="grid grid-cols-[repeat(2,auto)_1fr_repeat(2,auto)] items-center gap-3"
                      >
                        <Seat
                          seat={row[0]}
                          status={
                            row[0]
                              ? isSeatBooked(row[0].id)
                                ? "booked"
                                : selectedSeat === row[0].id
                                ? "selected"
                                : "free"
                              : "free"
                          }
                          onClick={handleSeatClick}
                        />
                        <Seat
                          seat={row[1]}
                          status={
                            row[1]
                              ? isSeatBooked(row[1].id)
                                ? "booked"
                                : selectedSeat === row[1].id
                                ? "selected"
                                : "free"
                              : "free"
                          }
                          onClick={handleSeatClick}
                        />

                        <div className="h-10 flex items-center justify-center text-[10px] text-slate-400">
                          {rIndex === 0 ? "FRONTE" : ""}
                        </div>

                        <Seat
                          seat={row[2]}
                          status={
                            row[2]
                              ? isSeatBooked(row[2].id)
                                ? "booked"
                                : selectedSeat === row[2].id
                                ? "selected"
                                : "free"
                              : "free"
                          }
                          onClick={handleSeatClick}
                        />
                        <Seat
                          seat={row[3]}
                          status={
                            row[3]
                              ? isSeatBooked(row[3].id)
                                ? "booked"
                                : selectedSeat === row[3].id
                                ? "selected"
                                : "free"
                              : "free"
                          }
                          onClick={handleSeatClick}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 text-xs text-slate-500 flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 border border-gray-300 rounded inline-block" />{" "}
                      Libero
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 bg-emerald-500 rounded inline-block" />{" "}
                      Selezionato
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 bg-gray-300 rounded inline-block" />{" "}
                      Occupato
                    </span>
                  </div>
                </div>

                {/* Form prenotazione */}
                <div className="w-full md:w-80">
                  <div className="p-3 border rounded-lg bg-white text-sm">
                    <h3 className="font-medium mb-1">Prenota posto</h3>
                    <p className="text-xs text-slate-500 mb-3">
                      Posto selezionato:{" "}
                      <span className="font-semibold">
                        {selectedSeat || "—"}
                      </span>
                    </p>

                    <div className="grid gap-2 text-sm">
                      <input
                        placeholder="Nome"
                        value={form.nome}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, nome: e.target.value }))
                        }
                        className="border px-2 py-1 rounded"
                      />
                      <input
                        placeholder="Cognome"
                        value={form.cognome}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, cognome: e.target.value }))
                        }
                        className="border px-2 py-1 rounded"
                      />
                      <input
                        placeholder="Telefono"
                        value={form.telefono}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            telefono: e.target.value,
                          }))
                        }
                        className="border px-2 py-1 rounded"
                      />
                      <input
                        placeholder="Luogo di partenza"
                        value={form.partenza}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, partenza: e.target.value }))
                        }
                        className="border px-2 py-1 rounded"
                      />

                      <label className="text-xs mt-1">
                        Data di partenza (viaggio)
                      </label>
                      <input
                        type="date"
                        value={form.dataPartenza}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            dataPartenza: e.target.value,
                          }))
                        }
                        className="border px-2 py-1 rounded"
                      />

                      <label className="text-xs mt-1">Meta viaggio</label>
                      <select
                        value={form.destinazione}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            destinazione: e.target.value,
                          }))
                        }
                        className="border px-2 py-1 rounded text-sm"
                      >
                        {trips.map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name}{" "}
                            {t.date ? `(${t.date})` : ""}
                          </option>
                        ))}
                      </select>
                      {loadingTrips && (
                        <p className="text-[11px] text-slate-500">
                          Carico mete dal server...
                        </p>
                      )}

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={handleBook}
                          className="flex-1 px-3 py-1.5 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700"
                        >
                          Conferma
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSeat(null);
                            setForm((f) => ({
                              ...f,
                              nome: "",
                              cognome: "",
                              telefono: "",
                              partenza: "",
                              dataPartenza: "",
                            }));
                          }}
                          className="px-3 py-1.5 rounded border text-sm"
                        >
                          Pulisci
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Aside: mete + prenotazioni + area admin */}
          <aside className="space-y-4">
            {/* Mete & date (solo admin) */}
            {isAdmin && (
              <div className="p-4 bg-white border rounded-lg text-sm">
                <h3 className="font-medium mb-2">Mete &amp; date</h3>
                <ul className="space-y-2">
                  {trips.map((t) => (
                    <li
                      key={t.id}
                      className="flex justify-between items-center gap-2"
                    >
                      <span>
                        {t.name}{" "}
                        {t.date && (
                          <span className="text-xs text-slate-500">
                            ({t.date})
                          </span>
                        )}
                      </span>
                      <div className="flex gap-2 text-xs">
                        <button
                          onClick={() => editTrip(t)}
                          className="underline"
                        >
                          Modifica
                        </button>
                        <button
                          onClick={() => removeTrip(t)}
                          className="text-red-600"
                        >
                          Elimina
                        </button>
                      </div>
                    </li>
                  ))}
                  {trips.length === 0 && !loadingTrips && (
                    <li className="text-xs text-slate-500">
                      Nessuna meta. Aggiungine una.
                    </li>
                  )}
                </ul>

                <button
                  onClick={addTrip}
                  className="mt-3 px-3 py-1.5 rounded border text-sm w-full"
                >
                  Aggiungi meta
                </button>
              </div>
            )}

            {/* Prenotazioni (viste da tutti) */}
            <div className="p-4 bg-white border rounded-lg text-sm">
              <h3 className="font-medium mb-2">
                Prenotazioni ({bookings.length})
              </h3>
              <div className="space-y-2 max-h-72 overflow-auto">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-2 border rounded flex justify-between items-start gap-2"
                  >
                    <div>
                      <div className="font-medium">
                        {b.nome} {b.cognome} — posto {b.seat} (bus {b.busType})
                      </div>
                      <div className="text-xs text-slate-500">
                        {b.partenza} → {b.destinazione}
                      </div>
                      <div className="text-xs text-slate-500">
                        Data partenza:{" "}
                        {b.data_partenza &&
                          new Date(b.data_partenza).toLocaleDateString("it-IT")}
                      </div>
                      <div className="text-xs text-slate-500">
                        Tel: {b.telefono}
                      </div>
                      {b.created_at && (
                        <div className="text-[11px] text-slate-400 mt-1">
                          Prenotato il{" "}
                          {new Date(b.created_at).toLocaleDateString("it-IT")}{" "}
                          alle{" "}
                          {new Date(b.created_at).toLocaleTimeString("it-IT", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex flex-col items-end gap-1">
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          className="text-xs text-red-600"
                        >
                          Annulla
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {bookings.length === 0 && (
                  <div className="text-xs text-slate-500">
                    Nessuna prenotazione per questo bus.
                  </div>
                )}
              </div>
            </div>

            {/* Area admin: lista partecipanti + piantina completa */}
            {isAdmin && (
              <div className="p-4 bg-white border rounded-lg text-sm">
                <h3 className="font-medium mb-2">
                  {isBusFull
                    ? "BUS COMPLETO – Lista partecipanti"
                    : "Lista partecipanti (area riservata)"}
                </h3>

                <p className="text-xs text-slate-500 mb-2">
                  Bus GT {busType} — posti prenotati: {bookings.length}/
                  {capacity}
                </p>

                <div className="max-h-64 overflow-auto border rounded mb-3">
                  <table className="w-full text-[11px]">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-2 py-1 text-left">Posto</th>
                        <th className="px-2 py-1 text-left">Nome</th>
                        <th className="px-2 py-1 text-left">Partenza</th>
                        <th className="px-2 py-1 text-left">Meta</th>
                        <th className="px-2 py-1 text-left">Tel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} className="border-t">
                          <td className="px-2 py-1">{b.seat}</td>
                          <td className="px-2 py-1">
                            {b.nome} {b.cognome}
                          </td>
                          <td className="px-2 py-1">{b.partenza}</td>
                          <td className="px-2 py-1">{b.destinazione}</td>
                          <td className="px-2 py-1">{b.telefono}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h4 className="font-medium mb-1 text-xs">
                  Piantina completa (testo)
                </h4>
                <div className="max-h-48 overflow-auto border rounded p-2 text-[11px] space-y-1">
                  {Array.from({ length: capacity }, (_, i) => i + 1).map(
                    (seatNumber) => {
                      const booking = bookings.find(
                        (b) => Number(b.seat) === seatNumber
                      );
                      return (
                        <div key={seatNumber}>
                          <span className="font-semibold">
                            Posto {seatNumber}:
                          </span>{" "}
                          {booking
                            ? `${booking.nome} ${booking.cognome} — ${booking.partenza} → ${booking.destinazione} (Tel: ${booking.telefono})`
                            : "LIBERO"}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </aside>
        </main>
      </div>
    </div>
  );
}
