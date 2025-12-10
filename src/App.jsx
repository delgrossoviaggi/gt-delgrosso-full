import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";

/**
 * DELGROSSO VIAGGI & LIMOUSINE BUS
 * Gestionale prenotazioni bus GT con Supabase.
 */

const DEFAULT_DESTINATIONS = ["Milano", "Roma", "Venezia"];

function generateSeats(totalSeats) {
  const seats = [];
  let n = 1;
  while (n <= totalSeats) {
    const row = [null, null, null, null]; // 2 sinistra - corridoio - 2 destra
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
    "w-10 h-10 flex items-center justify-center rounded-md text-sm cursor-pointer border transition";
  const cls =
    status === "booked"
      ? base +
        " bg-gray-300 border-gray-400 text-gray-700 cursor-not-allowed line-through"
      : status === "selected"
      ? base + " bg-blue-500 text-white border-blue-700 shadow"
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

export default function App() {
  const [busType, setBusType] = useState("53");
  const [seatsLayout, setSeatsLayout] = useState(() => generateSeats(53));
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [destinations, setDestinations] = useState(() => {
    try {
      const saved = localStorage.getItem("dg_destinations");
      return saved ? JSON.parse(saved) : DEFAULT_DESTINATIONS;
    } catch {
      return DEFAULT_DESTINATIONS;
    }
  });

  const [selectedSeat, setSelectedSeat] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    cognome: "",
    telefono: "",
    partenza: "",
    destinazione: DEFAULT_DESTINATIONS[0],
  });

  const [logoDataUrl, setLogoDataUrl] = useState(() => {
    try {
      return localStorage.getItem("dg_logo") || "";
    } catch {
      return "";
    }
  });

  const [message, setMessage] = useState("");

  // Aggiorna piantina quando cambia tipo di bus
  useEffect(() => {
    const total = Number(busType);
    setSeatsLayout(generateSeats(total));
  }, [busType]);

  // Salva destinazioni e logo in localStorage
  useEffect(() => {
    localStorage.setItem("dg_destinations", JSON.stringify(destinations));
  }, [destinations]);

  useEffect(() => {
    if (logoDataUrl) {
      localStorage.setItem("dg_logo", logoDataUrl);
    }
  }, [logoDataUrl]);

  // Carica prenotazioni dal backend quando cambia il bus
  useEffect(() => {
    loadBookings(busType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busType]);

  async function loadBookings(currentBusType) {
    try {
      setLoadingBookings(true);
      setMessage("");
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("busType", String(currentBusType))
        .order("seat", { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error(err);
      setMessage(
        "Errore nel caricare le prenotazioni dal server. Controlla la connessione o Supabase."
      );
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

  function handleLogoUpload(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(String(reader.result));
    reader.readAsDataURL(f);
  }

  function addDestination() {
    const name = window.prompt("Nuova destinazione:");
    if (!name) return;
    setDestinations((prev) => [...prev, name]);
  }

  function editDestination(index) {
    const newName = window.prompt(
      "Modifica destinazione:",
      destinations[index]
    );
    if (!newName) return;
    setDestinations((prev) =>
      prev.map((d, i) => (i === index ? newName : d))
    );
  }

  function removeDestination(index) {
    if (!window.confirm("Eliminare questa destinazione?")) return;
    setDestinations((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleBook() {
    if (!selectedSeat) {
      alert("Seleziona prima un posto sul bus.");
      return;
    }
    if (!form.nome || !form.cognome || !form.telefono || !form.partenza) {
      alert("Compila tutti i campi obbligatori.");
      return;
    }

    const seatAlreadyBooked = bookings.some(
      (b) => Number(b.seat) === Number(selectedSeat)
    );
    if (seatAlreadyBooked) {
      alert("Questo posto è già stato prenotato. Aggiorna la pagina.");
      await loadBookings(busType);
      return;
    }

    try {
      setMessage("Invio prenotazione...");
      const { error } = await supabase.from("bookings").insert({
        seat: selectedSeat,
        nome: form.nome,
        cognome: form.cognome,
        telefono: form.telefono,
        partenza: form.partenza,
        destinazione:
          form.destinazione || destinations[0] || DEFAULT_DESTINATIONS[0],
        busType: String(busType),
      });

      if (error) throw error;

      setMessage("Prenotazione salvata con successo!");
      setSelectedSeat(null);
      setForm({
        nome: "",
        cognome: "",
        telefono: "",
        partenza: "",
        destinazione: destinations[0] || DEFAULT_DESTINATIONS[0],
      });
      await loadBookings(busType);
    } catch (err) {
      console.error(err);
      setMessage("Errore nel salvare la prenotazione. Controlla Supabase.");
    }
  }

  async function handleCancelBooking(id) {
    if (!window.confirm("Vuoi annullare questa prenotazione?")) return;
    try {
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) throw error;
      setMessage("Prenotazione annullata.");
      await loadBookings(busType);
    } catch (err) {
      console.error(err);
      setMessage("Errore nell'annullare la prenotazione.");
    }
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-slate-50">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-md p-4 sm:p-6">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-4">
            {logoDataUrl ? (
              <img
                src={logoDataUrl}
                alt="DelGrosso logo"
                className="w-28 h-16 object-contain"
              />
            ) : (
              <div className="w-28 h-16 flex items-center justify-center bg-slate-100 rounded-lg font-semibold text-xs text-center">
                DELGROSSO
                <br />
                VIAGGI
              </div>
            )}

            <div>
              <h1 className="text-xl sm:text-2xl font-semibold">
                DELGROSSO VIAGGI &amp; LIMOUSINE BUS
              </h1>
              <p className="text-sm text-slate-500">
                Gestionale prenotazioni posti Bus GT
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2">
            <div className="flex items-center gap-2 text-sm">
              <span>Tipo bus:</span>
              <select
                value={busType}
                onChange={(e) => {
                  setBusType(e.target.value);
                  setSelectedSeat(null);
                }}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="53">GT 53 posti</option>
                <option value="63">GT 63 posti</option>
              </select>
            </div>
            <div className="text-xs text-slate-500">
              Prenotazioni salvate su Supabase (tabella <code>bookings</code>).
            </div>
            <div className="text-xs">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <span>Logo:</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>
        </header>

        {/* Messaggi */}
        {message && (
          <div className="mb-4 text-xs px-3 py-2 rounded bg-amber-50 border border-amber-200 text-amber-800">
            {message}
          </div>
        )}

        {/* Main layout */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seat map + booking form */}
          <section className="lg:col-span-2">
            <h2 className="font-semibold mb-2">
              Piantina posti — Bus GT {busType} posti
            </h2>

            <div className="bg-slate-50 border rounded-xl p-4">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Seat map */}
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
                        {/* lato sinistro */}
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

                        {/* corridoio */}
                        <div className="h-10 flex items-center justify-center text-[10px] text-slate-400">
                          {rIndex === 0 ? "FRONTE" : ""}
                        </div>

                        {/* lato destro */}
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
                      <span className="w-3 h-3 bg-blue-500 rounded inline-block" />{" "}
                      Selezionato
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 bg-gray-300 rounded inline-block" />{" "}
                      Occupato
                    </span>
                  </div>
                </div>

                {/* Booking form */}
                <div className="w-full md:w-80">
                  <div className="p-3 border rounded-lg bg-white">
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
                          setForm((f) => ({ ...f, telefono: e.target.value }))
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

                      <label className="text-xs mt-1">Destinazione</label>
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
                        {destinations.map((d, i) => (
                          <option key={i} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={handleBook}
                          className="flex-1 px-3 py-1.5 rounded bg-green-600 text-white text-sm hover:bg-green-700"
                        >
                          Conferma prenotazione
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSeat(null);
                            setForm({
                              nome: "",
                              cognome: "",
                              telefono: "",
                              partenza: "",
                              destinazione:
                                destinations[0] || DEFAULT_DESTINATIONS[0],
                            });
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

          {/* Destinazioni + elenco prenotazioni */}
          <aside className="space-y-4">
            <div className="p-4 bg-white border rounded-lg">
              <h3 className="font-medium mb-2">Destinazioni</h3>
              <ul className="space-y-2 text-sm">
                {destinations.map((d, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center gap-2"
                  >
                    <span>{d}</span>
                    <div className="flex gap-2 text-xs">
                      <button
                        onClick={() => editDestination(i)}
                        className="underline"
                      >
                        Modifica
                      </button>
                      <button
                        onClick={() => removeDestination(i)}
                        className="text-red-600"
                      >
                        Elimina
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                onClick={addDestination}
                className="mt-3 px-3 py-1.5 rounded border text-sm w-full"
              >
                Aggiungi destinazione
              </button>
            </div>

            <div className="p-4 bg-white border rounded-lg">
              <h3 className="font-medium mb-2">
                Prenotazioni ({bookings.length})
              </h3>
              <div className="space-y-2 max-h-72 overflow-auto text-sm">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-2 border rounded flex justify-between items-start gap-2"
                  >
                    <div>
                      <div className="font-medium">
                        {b.nome} {b.cognome} — posto {b.seat}
                      </div>
                      <div className="text-xs text-slate-500">
                        {b.partenza} → {b.destinazione}
                      </div>
                      <div className="text-xs text-slate-500">
                        Tel: {b.telefono}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {b.created_at && (
                        <div className="text-[10px] text-slate-400">
                          {new Date(b.created_at).toLocaleString()}
                        </div>
                      )}
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        className="text-xs text-red-600"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                ))}
                {bookings.length === 0 && (
                  <div className="text-xs text-slate-500">
                    Nessuna prenotazione per questo bus.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </main>

        <footer className="mt-6 text-xs text-slate-500 leading-relaxed">
          <p>
            Nota: questa app usa Supabase come backend per salvare le
            prenotazioni (tabella <code>bookings</code>), mentre logo e
            destinazioni sono salvati localmente nel browser dell&apos;admin
            (localStorage).
          </p>
        </footer>
      </div>
    </div>
  );
}
