import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { LayoutGrid, MessageCircle, Settings, Zap } from "lucide-react";
import FlowCanvas from "./components/FlowBuilder/FlowCanvas";
import ConversationsList from "./components/Conversations/ConversationList";
import QuestionList from "./components/Questions/QuestionList";
import { setPartnerId } from "./services/api";

// ✅ Partner selector component
const PartnerSelector = ({ onPartnerChange, currentPartner }) => {
  const testPartners = [
    { id: "test-partner-1", name: "Test Client A" },
    { id: "test-partner-2", name: "Test Client B" },
    { id: "test-partner-3", name: "Test Client C" },
  ];

  return (
    <div className="bg-slate-800 border-b border-slate-700 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-slate-300">
            🏢 Current Client:
          </label>
          <select
            value={currentPartner}
            onChange={(e) => onPartnerChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {testPartners.map((partner) => (
              <option key={partner.id} value={partner.id}>
                {partner.name} ({partner.id})
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-400">
          Switch between different clients to test flow isolation
        </p>
      </div>
    </div>
  );
};

function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Visual Builder", icon: LayoutGrid },
    { path: "/questions", label: "Questions", icon: Settings },
    { path: "/conversations", label: "Conversations", icon: MessageCircle },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-700">
      <div className="mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Chatbot Admin</h1>
          </div>

          {/* Navigation Links */}
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  // ✅ Multi-tenant state management
  const [currentPartnerId, setCurrentPartnerId] = useState("test-partner-1");

  // ✅ Handle partner change
  const handlePartnerChange = (newPartnerId) => {
    setCurrentPartnerId(newPartnerId);
    setPartnerId(newPartnerId); // Update API context
    console.log("🏢 Switched to partner:", newPartnerId);
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navigation />

        {/* ✅ Partner selector */}
        <PartnerSelector
          currentPartner={currentPartnerId}
          onPartnerChange={handlePartnerChange}
        />

        <main className="h-[calc(100vh-8rem)]">
          {" "}
          {/* ✅ Adjusted height for partner selector */}
          <Routes>
            <Route
              path="/"
              element={
                <FlowCanvas
                  key={currentPartnerId} // ✅ Force re-mount when partner changes
                  uniquePartnerId={currentPartnerId}
                />
              }
            />
            <Route
              path="/questions"
              element={
                <QuestionList
                  key={`questions-${currentPartnerId}`} // ✅ Force re-mount when partner changes
                  uniquePartnerId={currentPartnerId}
                />
              }
            />
            <Route
              path="/conversations"
              element={
                <ConversationsList
                  key={`conversations-${currentPartnerId}`} // ✅ Force re-mount when partner changes
                  uniquePartnerId={currentPartnerId}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
