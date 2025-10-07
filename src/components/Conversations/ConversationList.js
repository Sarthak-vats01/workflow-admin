import React, { useState, useEffect } from "react";
import { MessageCircle, User, Clock, CheckCircle } from "lucide-react";
import { conversationAPI } from "../../services/api";

const ConversationsList = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await conversationAPI.getAll();
      setConversations(response.data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Conversations</h1>
            <p className="text-slate-600 mt-1">
              {conversations.length} total conversations
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No conversations yet
            </h3>
            <p className="text-slate-600">
              Conversations will appear here when users interact with your
              chatbot
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {conversations.map((conversation) => (
              <div
                key={conversation._id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        User {conversation.userId.slice(-8)}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            conversation.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {conversation.status}
                        </span>
                        <span className="flex items-center text-sm text-slate-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(conversation.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-slate-900">
                      {conversation.answers.length} responses
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900">
                    Conversation History
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                    {conversation.answers.map((answer, index) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-3">
                        <div className="text-sm font-medium text-slate-900 mb-1">
                          Q:{" "}
                          {answer.questionText || "Question text not available"}
                        </div>
                        <div className="text-sm text-slate-600">
                          A: {answer.answer}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {formatDate(answer.answeredAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsList;
