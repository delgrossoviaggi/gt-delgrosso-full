import React from "react";
import logo from "./assets/logo.png";

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <img
        src={logo}
        alt="Logo"
        className="w-48 h-auto mb-6"
      />
      <h1 className="text-3xl font-bold text-gray-800">
        Benvenuto!
      </h1>
      <p className="text-gray-600 mt-2">
        L'app sta funzionando correttamente. 🚀
      </p>
    </div>
  );
}

export default App;
