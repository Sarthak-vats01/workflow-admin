import React from "react";
import {
  Play,
  Type,
  CheckCircle,
  MessageCircle,
  Mail,
  XCircle,
  Edit,
  Trash2,
} from "lucide-react";

const FlowNode = ({
  node,
  isSelected,
  onClick,
  onRightClick,
  onEdit,
  onDelete,
}) => {
  const getNodeConfig = (type) => {
    const configs = {
      start: {
        icon: Play,
        bgColor: "bg-gradient-to-br from-emerald-500 to-emerald-600",
        borderColor: "border-emerald-400",
      },
      "text-input": {
        icon: Type,
        bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
        borderColor: "border-blue-400",
      },
      "multiple-choice": {
        icon: CheckCircle,
        bgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
        borderColor: "border-purple-400",
      },
      "data-collection": {
        icon: Mail,
        bgColor: "bg-gradient-to-br from-green-500 to-green-600",
        borderColor: "border-green-400",
      },
      message: {
        icon: MessageCircle,
        bgColor: "bg-gradient-to-br from-amber-500 to-amber-600",
        borderColor: "border-amber-400",
      },
      end: {
        icon: XCircle,
        bgColor: "bg-gradient-to-br from-red-500 to-red-600",
        borderColor: "border-red-400",
      },
    };
    return configs[type] || configs["text-input"];
  };

  const config = getNodeConfig(node.type);
  const Icon = config.icon;

  const getNodeTitle = (type) => {
    const titles = {
      start: "Start Point",
      "text-input": "Text Input",
      "multiple-choice": "Multiple Choice",
      "data-collection": "Data Collection",
      message: "Bot Message",
      end: "End Conversation",
    };
    return titles[type] || "Question";
  };

  // Clean title display - first 40 characters
  const getDisplayTitle = (text) => {
    if (!text) return "Untitled Question";
    const firstLine = text.split("\n")[0];
    return firstLine.length > 40
      ? firstLine.substring(0, 37) + "..."
      : firstLine;
  };

  return (
    <div
      className={`absolute group cursor-pointer transition-all duration-200 ${
        isSelected ? "z-30" : "z-20"
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
        transform: "translate(-50%, -50%)",
      }}
      onClick={(e) => onClick(node, e)}
      onContextMenu={(e) => onRightClick(node, e)}
      onDoubleClick={() => onEdit()}
    >
      {/* Selection Ring */}
      {isSelected && (
        <div className="absolute inset-0 rounded-xl border-2 border-blue-400 shadow-lg shadow-blue-400/50 scale-110" />
      )}

      {/* Clean, Minimal Node */}
      <div
        className={`
        relative w-48 bg-slate-800 rounded-xl shadow-xl border-2 ${config.borderColor}
        hover:shadow-2xl transition-all duration-200 hover:scale-105
      `}
      >
        {/* Compact Header */}
        <div className={`${config.bgColor} px-3 py-2 rounded-t-xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="w-4 h-4 text-white" />
              <span className="font-medium text-white text-sm">
                {getNodeTitle(node.type)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1 hover:bg-black hover:bg-opacity-20 rounded text-white"
                title="Edit question"
              >
                <Edit className="w-3 h-3" />
              </button>
              {node.type !== "start" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-1 hover:bg-red-500 rounded text-white"
                  title="Delete question"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Title Only Content */}
        <div className="p-3 text-slate-200">
          <p className="text-sm font-medium leading-relaxed">
            {getDisplayTitle(node.data.text)}
          </p>

          {/* Quick Visual Indicators */}
          <div className="mt-2 flex items-center space-x-2 flex-wrap">
            {/* Choice Options Count */}
            {node.data.options && node.data.options.length > 0 && (
              <span className="text-xs text-purple-400 bg-purple-500 bg-opacity-20 px-2 py-0.5 rounded-full">
                {node.data.options.length} options
              </span>
            )}

            {/* Data Collection Type */}
            {node.data.dataCollection?.dataType &&
              node.data.dataCollection.dataType !== "text" && (
                <span className="text-xs text-green-400 bg-green-500 bg-opacity-20 px-2 py-0.5 rounded-full">
                  {node.data.dataCollection.dataType}
                </span>
              )}

            {/* Auto-advance */}
            {node.data.messageSettings?.autoAdvance && (
              <span className="text-xs text-amber-400 bg-amber-500 bg-opacity-20 px-2 py-0.5 rounded-full">
                Auto
              </span>
            )}

            {/* Required Field */}
            {node.data.dataCollection?.isRequired && (
              <span className="text-xs text-red-400 bg-red-500 bg-opacity-20 px-2 py-0.5 rounded-full">
                Required
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowNode;
