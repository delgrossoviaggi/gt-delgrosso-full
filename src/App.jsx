iimport React, { useState } from "react";

function Navbar() {
  const handleScroll = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur border-b border-gray-200 z-20">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div
          className="text-xl font-extrabold tracking-tight text-indigo-700 cursor-pointer"
          onClick={() => handleScroll("top")}
        >
          GT Delgrosso
        </div>

        <div className="hidden sm:flex gap-6 text-sm font-medium text-gray-700">
          <button onClick={() => handleScroll("top")} className="hover:text-indigo-600">
            Home
          </button>
          <button onClick={() => handleScroll("services")} className="hover:text-indigo-600">
            Servizi
          </button>
          <button onClick={() => handleScroll("booking")} className="hover:text-indigo-600">
            Prenota
          </button>
          <button onClick={() => handleScroll("contacts")} className="hover:text-indigo-600">
            Contatti
          </button>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  const handleScrollBooking = () => {
    const el = document.getElementById("booking");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="top"
      className="min-h-screen flex items-center bg-gradient-to-b from-indigo-50 to-white"
    >
      <div className="max-w-5xl mx-auto px-4 pt-20 pb-16 flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            Benvenuto su <span className="text-indigo-700">GT Delgrosso</span>
            <br />
            il tuo viaggio inizia qui 🚍
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            Prenota facilmente il tuo posto sul bus discoteca o sugli autobus Gran Turismo.
            Gestisci le tue serate, gite e viaggi di gruppo direttamente online.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleScrollBooking}
              className="px-5 py-3 text-sm font-semibold rounded-full bg-indigo-600 text-white shadow hover:bg-indigo-700 transition"
            >
              Prenota ora
            </button>
            <a
              href="#services"
              className="px-5 py-3 text-sm font-semibold rounded-full border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition"
            >
              Scopri i servizi
            </a>
          </div>
        </div>

        <div className="flex-1 w-full">
          <div className="rounded-3xl border border-indigo-100 bg-white shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Perché scegliere GT Delgrosso?
            </h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Bus discoteca per feste, compleanni, addii al celibato/nubilato</li>
              <li>• Autobus Gran Turismo per viaggi lunghi e gite organizzate</li>
              <li>• Prenotazione semplice e veloce, anche da smartphone</li>
              <li>• Servizio sicuro, puntuale e professionale</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  return (
    <section id="services" className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          I nostri servizi
        </h2>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
          Scegli il tipo di bus più adatto al tuo evento: dalla serata in discoteca al viaggio
          di più giorni con il massimo comfort.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-6">
            <h3 className="text-xl font-semibold text-indigo-800 mb-2">Bus Discoteca</h3>
            <p className="text-sm text-indigo-900 mb-3">
              Luci, musica e divertimento già dal viaggio. Ideale per:
            </p>
            <ul className="text-sm text-indigo-900 space-y-1">
              <li>• Serate in discoteca</li>
              <li>• Compleanni ed eventi privati</li>
              <li>• Addii al celibato/nubilato</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Autobus Gran Turismo</h3>
            <p className="text-sm text-gray-700 mb-3">
              Comfort e sicurezza per viaggi più lunghi, perfetto per:
            </p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Gite scolastiche e parrocchiali</li>
              <li>• Viaggi di gruppo e associazioni</li>
              <li>• Trasferte per eventi e concerti</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function BookingForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    date: "",
    type: "bus-discoteca",
    seats: "",
    from: "",
    to: "",
    notes: "",
