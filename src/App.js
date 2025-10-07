import React from "react";
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
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navigation />

        <main className="h-[calc(100vh-4rem)]">
          <Routes>
            <Route path="/" element={<FlowCanvas />} />
            <Route path="/questions" element={<QuestionList />} />
            <Route path="/conversations" element={<ConversationsList />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
