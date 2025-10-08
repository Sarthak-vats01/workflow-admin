import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  ExternalLink,
  Mail,
  MessageSquare,
} from "lucide-react";

import { questionAPI } from "../../services/api";

const NodeEditor = ({ node, onSave, onClose }) => {
  const [formData, setFormData] = useState(() => {
    // Ensure proper default structure for all fields
    const safeDataCollection = {
      isRequired: node.data.dataCollection?.isRequired || false,
      dataType: node.data.dataCollection?.dataType || "text",
      placeholder: node.data.dataCollection?.placeholder || "",
      validation: {
        minLength: node.data.dataCollection?.validation?.minLength || 0,
        maxLength: node.data.dataCollection?.validation?.maxLength || 500,
        errorMessage: node.data.dataCollection?.validation?.errorMessage || "",
      },
    };

    const safeMessageSettings = {
      autoAdvance: node.data.messageSettings?.autoAdvance || true,
      delay: node.data.messageSettings?.delay || 1500,
      showTypingIndicator:
        node.data.messageSettings?.showTypingIndicator || true,
    };

    const safeOptions = node.data.options || [];

    return {
      text: node.data.text || "",
      type: node.data.questionType || "text",
      options: safeOptions,
      dataCollection: safeDataCollection,
      messageSettings: safeMessageSettings,
      nextQuestionId: node.data.nextQuestionId || "",
    };
  });

  // New state for available questions
  const [availableQuestions, setAvailableQuestions] = useState([]);

  // Close modal with Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Load available questions for dropdown
  useEffect(() => {
    const loadAvailableQuestions = async () => {
      try {
        const response = await questionAPI.getAll();
        const questions = response.data || response;
        // Filter out current question to prevent self-reference
        const filteredQuestions = questions.filter((q) => q._id !== node.id);
        setAvailableQuestions(filteredQuestions);
      } catch (error) {
        console.error("Error loading questions for dropdown:", error);
        setAvailableQuestions([]);
      }
    };

    loadAvailableQuestions();
  }, [node.id]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        text: formData.text,
        questionType: formData.type,
        // ✅ HYBRID ROUTING: Choice questions use options, others use nextQuestionId
        options: formData.type === "choice" ? formData.options : [],
        dataCollection: formData.dataCollection,
        messageSettings: formData.messageSettings,
        // ✅ For non-choice questions, set nextQuestionId from form
        nextQuestionId:
          formData.type !== "choice" ? formData.nextQuestionId : null,
      },
    };

    console.log("💾 Saving node with hybrid routing:", updatedNode);
    onSave(updatedNode);
  };

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        {
          label: "",
          actionType: "next_question",
          actionValue: "",
          nextQuestionId: null,
          buttonStyle: {
            variant: "primary",
            size: "medium",
          },
        },
      ],
    }));
  };

  const updateOption = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((option, i) =>
        i === index ? { ...option, [field]: value } : option
      ),
    }));
  };

  const updateOptionButtonStyle = (index, styleField, value) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((option, i) =>
        i === index
          ? {
              ...option,
              buttonStyle: { ...option.buttonStyle, [styleField]: value },
            }
          : option
      ),
    }));
  };

  const removeOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  // Safe update for data collection validation
  const updateDataCollectionValidation = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      dataCollection: {
        ...prev.dataCollection,
        validation: {
          ...prev.dataCollection.validation,
          [field]: value,
        },
      },
    }));
  };

  // Safe update for data collection
  const updateDataCollection = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      dataCollection: {
        ...prev.dataCollection,
        [field]: value,
      },
    }));
  };

  // Safe update for message settings
  const updateMessageSettings = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      messageSettings: {
        ...prev.messageSettings,
        [field]: value,
      },
    }));
  };

  const getNodeTitle = (type) => {
    const titles = {
      start: "Start Point",
      text: "Text Input",
      choice: "Multiple Choice",
      data_collection: "Data Collection",
      message: "Bot Message",
      end: "End Conversation",
    };
    return titles[type] || "Question";
  };

  return (
    // Fixed positioning with proper z-index and backdrop
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Edit {getNodeTitle(formData.type)}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Configure the content and behavior of this node
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form - Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Question Type Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Question Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, type: e.target.value }))
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="text">Text Input</option>
                <option value="choice">Multiple Choice</option>
                <option value="data_collection">Data Collection</option>
                <option value="message">Bot Message</option>
                <option value="end">End Conversation</option>
              </select>
            </div>

            {/* Text Content */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {formData.type === "message" ? "Message Text" : "Question Text"}
              </label>
              <textarea
                value={formData.text}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, text: e.target.value }))
                }
                placeholder={
                  formData.type === "message"
                    ? "Enter the message you want to show to users..."
                    : "Enter your question here..."
                }
                rows={4}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                required
              />
            </div>

            {/* Message Settings */}
            {formData.type === "message" && (
              <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                <h3 className="font-medium text-white mb-3 flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span>Message Settings</span>
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.messageSettings.autoAdvance}
                      onChange={(e) =>
                        updateMessageSettings("autoAdvance", e.target.checked)
                      }
                      className="rounded bg-slate-600 border-slate-500 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300">
                      Auto-advance to next question
                    </span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Display Delay (ms)
                    </label>
                    <input
                      type="number"
                      value={formData.messageSettings.delay}
                      onChange={(e) =>
                        updateMessageSettings("delay", parseInt(e.target.value))
                      }
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="500"
                      max="5000"
                      step="100"
                    />
                  </div>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.messageSettings.showTypingIndicator}
                      onChange={(e) =>
                        updateMessageSettings(
                          "showTypingIndicator",
                          e.target.checked
                        )
                      }
                      className="rounded bg-slate-600 border-slate-500 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300">
                      Show typing indicator
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Data Collection Settings */}
            {formData.type === "data_collection" && (
              <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                <h3 className="font-medium text-white mb-3 flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-green-400" />
                  <span>Data Collection Settings</span>
                </h3>
                <div className="space-y-4">
                  {/* Data Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Data Type
                    </label>
                    <select
                      value={formData.dataCollection.dataType}
                      onChange={(e) =>
                        updateDataCollection("dataType", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="name">Name</option>
                      <option value="number">Number</option>
                      <option value="url">URL</option>
                    </select>
                  </div>

                  {/* Placeholder */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Placeholder Text
                    </label>
                    <input
                      type="text"
                      value={formData.dataCollection.placeholder}
                      onChange={(e) =>
                        updateDataCollection("placeholder", e.target.value)
                      }
                      placeholder="Enter placeholder text..."
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Required Field */}
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.dataCollection.isRequired}
                      onChange={(e) =>
                        updateDataCollection("isRequired", e.target.checked)
                      }
                      className="rounded bg-slate-600 border-slate-500 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-300">
                      Required field
                    </span>
                  </label>

                  {/* Validation Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Min Length
                      </label>
                      <input
                        type="number"
                        value={formData.dataCollection.validation.minLength}
                        onChange={(e) =>
                          updateDataCollectionValidation(
                            "minLength",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Max Length
                      </label>
                      <input
                        type="number"
                        value={formData.dataCollection.validation.maxLength}
                        onChange={(e) =>
                          updateDataCollectionValidation(
                            "maxLength",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Custom Error Message
                    </label>
                    <input
                      type="text"
                      value={formData.dataCollection.validation.errorMessage}
                      onChange={(e) =>
                        updateDataCollectionValidation(
                          "errorMessage",
                          e.target.value
                        )
                      }
                      placeholder="Custom validation error message..."
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ✅ SMART ROUTING UI - Different interfaces for different question types */}

            {/* For CHOICE questions - Use full options management */}
            {formData.type === "choice" && (
              <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-white flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                    <span>Choice Options & Routing</span>
                  </h3>
                  <button
                    type="button"
                    onClick={addOption}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Option</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.options.map((option, index) => (
                    <div
                      key={index}
                      className="bg-slate-600 p-3 rounded-lg border border-slate-500"
                    >
                      {/* Option Header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-300">
                          Option {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="p-1 text-red-400 hover:bg-red-500 hover:bg-opacity-20 rounded transition-colors"
                          title="Remove option"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Button Text */}
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Button Text
                        </label>
                        <input
                          type="text"
                          value={option.label}
                          onChange={(e) =>
                            updateOption(index, "label", e.target.value)
                          }
                          placeholder={`Option ${index + 1}`}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      {/* Next Question Dropdown */}
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center space-x-1">
                          <span>Next Question</span>
                          <span className="text-orange-400">*</span>
                        </label>
                        <select
                          value={option.nextQuestionId || ""}
                          onChange={(e) =>
                            updateOption(
                              index,
                              "nextQuestionId",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">
                            ⚠️ Select where this leads...
                          </option>
                          <optgroup label="📋 Available Questions">
                            {availableQuestions.map((q) => (
                              <option key={q._id} value={q._id}>
                                {q.text.length > 50
                                  ? q.text.substring(0, 47) + "..."
                                  : q.text}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="🎯 Special Actions">
                            <option value="END_CONVERSATION">
                              🔚 End Conversation
                            </option>
                          </optgroup>
                        </select>

                        {/* Visual feedback */}
                        {!option.nextQuestionId && (
                          <div className="mt-1 flex items-center space-x-1 text-xs text-orange-400">
                            <span>⚠️</span>
                            <span>This option needs a destination</span>
                          </div>
                        )}

                        {option.nextQuestionId && (
                          <div className="mt-1 flex items-center space-x-1 text-xs text-green-400">
                            <span>✅</span>
                            <span>Routing configured</span>
                          </div>
                        )}
                      </div>

                      {/* Action Type & Button Style */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Action
                          </label>
                          <select
                            value={option.actionType}
                            onChange={(e) =>
                              updateOption(index, "actionType", e.target.value)
                            }
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="next_question">Next Question</option>
                            <option value="external_link">External Link</option>
                            <option value="end_conversation">End Chat</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Style
                          </label>
                          <select
                            value={option.buttonStyle?.variant || "primary"}
                            onChange={(e) =>
                              updateOptionButtonStyle(
                                index,
                                "variant",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="primary">Primary</option>
                            <option value="secondary">Secondary</option>
                            <option value="success">Success</option>
                            <option value="warning">Warning</option>
                            <option value="danger">Danger</option>
                          </select>
                        </div>
                      </div>

                      {/* External Link URL */}
                      {option.actionType === "external_link" && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center space-x-1">
                            <ExternalLink className="w-3 h-3" />
                            <span>External URL</span>
                          </label>
                          <input
                            type="url"
                            value={option.actionValue || ""}
                            onChange={(e) =>
                              updateOption(index, "actionValue", e.target.value)
                            }
                            placeholder="https://example.com"
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-500 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Empty State */}
                  {formData.options.length === 0 && (
                    <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-600 rounded-lg">
                      <CheckCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No choice options yet</p>
                      <p className="text-xs">
                        Add options to create branching paths
                      </p>
                    </div>
                  )}
                </div>

                {/* Branching Summary */}
                {formData.options.length > 0 && (
                  <div className="mt-4 p-3 bg-slate-800 rounded-lg border border-slate-600">
                    <h4 className="text-xs font-medium text-slate-300 mb-2">
                      Branching Summary:
                    </h4>
                    <div className="space-y-1">
                      {formData.options.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-400">
                            "{option.label}" →
                          </span>
                          <span
                            className={
                              option.nextQuestionId
                                ? "text-green-400"
                                : "text-orange-400"
                            }
                          >
                            {option.nextQuestionId
                              ? option.nextQuestionId === "END_CONVERSATION"
                                ? "End Chat"
                                : availableQuestions
                                    .find(
                                      (q) => q._id === option.nextQuestionId
                                    )
                                    ?.text.substring(0, 25) + "..." ||
                                  "Question"
                              : "Not set"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* For NON-CHOICE questions - Use simple nextQuestionId dropdown */}
            {(formData.type === "message" ||
              formData.type === "text" ||
              formData.type === "data_collection") && (
              <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                <h3 className="font-medium text-white mb-3 flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                  <span>Next Question</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      After this question, go to:
                    </label>
                    <select
                      value={formData.nextQuestionId || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          nextQuestionId: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">⚠️ Select next question...</option>
                      <optgroup label="📋 Available Questions">
                        {availableQuestions.map((q) => (
                          <option key={q._id} value={q._id}>
                            {q.text.length > 50
                              ? q.text.substring(0, 47) + "..."
                              : q.text}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🎯 Special Actions">
                        <option value="END_CONVERSATION">
                          🔚 End Conversation
                        </option>
                      </optgroup>
                    </select>

                    {/* Visual feedback */}
                    {!formData.nextQuestionId && (
                      <div className="mt-2 flex items-center space-x-1 text-sm text-orange-400">
                        <span>⚠️</span>
                        <span>
                          Please select where this question should lead
                        </span>
                      </div>
                    )}

                    {formData.nextQuestionId &&
                      formData.nextQuestionId !== "END_CONVERSATION" && (
                        <div className="mt-2 flex items-center space-x-1 text-sm text-green-400">
                          <span>✅</span>
                          <span>
                            Will continue to:{" "}
                            {availableQuestions
                              .find((q) => q._id === formData.nextQuestionId)
                              ?.text?.substring(0, 30) + "..." ||
                              "Selected question"}
                          </span>
                        </div>
                      )}

                    {formData.nextQuestionId === "END_CONVERSATION" && (
                      <div className="mt-2 flex items-center space-x-1 text-sm text-red-400">
                        <span>🔚</span>
                        <span>Will end the conversation</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions - Fixed at bottom */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-700 bg-slate-800 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NodeEditor;
