import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Type,
  CheckCircle,
  MessageCircle,
  XCircle,
  Database,
  Play,
} from "lucide-react";

const ContextMenu = ({ x, y, onAddNode, parentNode, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const menuRef = useRef(null);

  const nodeTypes = [
    // {
    //   type: "text-input",
    //   icon: Type,
    //   label: "Text Input",
    //   description: "Ask user to type a response",
    //   color: "text-blue-400",
    //   bgColor: "hover:bg-blue-500/10",
    // },
    {
      type: "multiple-choice",
      icon: CheckCircle,
      label: "Multiple Choice",
      description: "Give user options to select",
      color: "text-purple-400",
      bgColor: "hover:bg-purple-500/10",
    },
    {
      type: "data-collection",
      icon: Database,
      label: "Data Collection",
      description: "Collect validated user data (email, phone, etc.)",
      color: "text-green-400",
      bgColor: "hover:bg-green-500/10",
    },
    {
      type: "message",
      icon: MessageCircle,
      label: "Bot Message",
      description: "Show information to user",
      color: "text-amber-400",
      bgColor: "hover:bg-amber-500/10",
    },
    {
      type: "end",
      icon: XCircle,
      label: "End Conversation",
      description: "Finish the conversation",
      color: "text-red-400",
      bgColor: "hover:bg-red-500/10",
    },
  ];

  const filteredTypes = nodeTypes.filter(
    (type) =>
      type.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Position menu to stay within viewport
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = x;
      let newY = y;

      if (x + rect.width > viewportWidth) {
        newX = viewportWidth - rect.width - 20;
      }

      if (y + rect.height > viewportHeight) {
        newY = viewportHeight - rect.height - 20;
      }

      setPosition({ x: Math.max(20, newX), y: Math.max(20, newY) });
    }
  }, [x, y]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-80 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 animate-scale-in overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h3 className="font-semibold text-white mb-3">
          {parentNode ? "Add Next Step" : "Add Node"}
        </h3>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search node types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
        </div>
      </div>

      {/* Options */}
      <div className="max-h-96 overflow-y-auto scrollbar-thin">
        {filteredTypes.map((nodeType) => {
          const Icon = nodeType.icon;

          return (
            <button
              key={nodeType.type}
              onClick={() => onAddNode(nodeType.type, parentNode)}
              className={`w-full p-4 flex items-start space-x-3 text-left transition-all duration-200 
                         ${nodeType.bgColor} border-b border-slate-700 last:border-b-0
                         hover:shadow-lg group`}
            >
              <div
                className={`p-2 rounded-lg bg-slate-700 ${nodeType.color} group-hover:scale-110 transition-transform`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white mb-1 group-hover:text-blue-300 transition-colors">
                  {nodeType.label}
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {nodeType.description}
                </p>

                {/* Enhanced descriptions */}
                {nodeType.type === "data-collection" && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                      Email
                    </span>
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                      Phone
                    </span>
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                      Validation
                    </span>
                  </div>
                )}

                {nodeType.type === "multiple-choice" && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                      External Links
                    </span>
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                      Button Styles
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {filteredTypes.length === 0 && (
        <div className="p-8 text-center">
          <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-400 text-sm">
            No node types found matching "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
};

export default ContextMenu;
