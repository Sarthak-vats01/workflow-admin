import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Type, CheckCircle } from "lucide-react";
import { questionAPI } from "../../services/api";

const QuestionList = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const response = await questionAPI.getAll();
      setQuestions(response.data);
    } catch (error) {
      console.error("Failed to load questions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Questions</h1>
            <p className="text-slate-600 mt-1">
              {questions.length} questions in your chatbot
            </p>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {questions.length === 0 ? (
          <div className="text-center py-12">
            <Type className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No questions yet
            </h3>
            <p className="text-slate-600">
              Use the Visual Builder to create your first question
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {questions.map((question) => (
              <div
                key={question._id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {question.type === "text" ? (
                        <Type className="w-4 h-4 text-blue-600" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-purple-600" />
                      )}
                      <span className="text-sm font-medium text-slate-600">
                        {question.type === "text"
                          ? "Text Input"
                          : "Multiple Choice"}
                      </span>
                      {question.isFirst && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Starting Question
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">
                      {question.text}
                    </h3>
                    {question.options && question.options.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {question.options.map((option, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-slate-100 text-slate-600 text-sm rounded"
                          >
                            {option.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
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

export default QuestionList;
