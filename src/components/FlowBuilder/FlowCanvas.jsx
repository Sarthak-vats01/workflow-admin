import React, { useState, useEffect, useRef, useCallback } from "react";
import { Save, Play, ZoomIn, ZoomOut, Grid, Eye } from "lucide-react";
import FlowNode from "./FlowNode";
import FlowConnection from "./FlowConnection";
import ContextMenu from "./ContextMenu";
import NodeEditor from "./NodeEditor";
import { questionAPI, setPartnerId } from "../../services/api";

const getDefaultText = (nodeType) => {
  const defaults = {
    "multiple-choice": "Please select an option:",
    "data-collection": "Please provide the following information:",
    message: "This is an informational message.",
    end: "Thank you for using our chatbot!",
  };
  return defaults[nodeType] || "New question";
};

const FlowCanvas = ({ uniquePartnerId = "test-partner-1" }) => {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [nodeEditor, setNodeEditor] = useState(null);
  const [viewportTransform, setViewportTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartTransform, setDragStartTransform] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // ✅ Set partner context when component mounts or partner changes
  useEffect(() => {
    if (uniquePartnerId) {
      setPartnerId(uniquePartnerId);
      console.log("🏢 FlowCanvas initialized for partner:", uniquePartnerId);
    }
  }, [uniquePartnerId]);

  // ✅ SMART AUTO-LAYOUT ALGORITHM (Your existing function - unchanged)
  const applySmartLayout = (nodes, connections) => {
    console.log("🎨 Applying smart auto-layout...");

    if (!nodes.length) return nodes;

    // Create relationship maps
    const childrenMap = new Map();
    const parentMap = new Map();
    const levels = new Map();

    // Build parent-child relationships
    connections.forEach((conn) => {
      if (!childrenMap.has(conn.source)) {
        childrenMap.set(conn.source, []);
      }
      childrenMap.get(conn.source).push(conn.target);
      parentMap.set(conn.target, conn.source);
    });

    // Find root nodes and assign levels
    const rootNodes = nodes.filter((node) => !parentMap.has(node.id));
    const layoutNodes = [...nodes];

    // Assign levels using BFS
    const queue = rootNodes.map((node) => ({ id: node.id, level: 0 }));
    levels.set(
      "roots",
      rootNodes.map((n) => n.id)
    );

    while (queue.length > 0) {
      const { id, level } = queue.shift();
      levels.set(id, level);

      const children = childrenMap.get(id) || [];
      children.forEach((childId) => {
        if (!levels.has(childId)) {
          queue.push({ id: childId, level: level + 1 });
        }
      });
    }

    // Group nodes by level
    const nodesByLevel = new Map();
    layoutNodes.forEach((node) => {
      const level = levels.get(node.id) || 0;
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level).push(node);
    });

    // Layout configuration
    const LEVEL_HEIGHT = 280;
    const NODE_SPACING = 320;
    const START_Y = 150;
    const CENTER_X = 600;

    // Position nodes level by level
    Array.from(nodesByLevel.keys())
      .sort((a, b) => a - b)
      .forEach((level) => {
        const levelNodes = nodesByLevel.get(level);
        const y = START_Y + level * LEVEL_HEIGHT;

        if (level === 0) {
          // Root level - center align
          const totalWidth = (levelNodes.length - 1) * NODE_SPACING;
          const startX = CENTER_X - totalWidth / 2;

          levelNodes.forEach((node, index) => {
            const nodeIndex = layoutNodes.findIndex((n) => n.id === node.id);
            if (nodeIndex !== -1) {
              layoutNodes[nodeIndex] = {
                ...layoutNodes[nodeIndex],
                position: {
                  x:
                    levelNodes.length === 1
                      ? CENTER_X
                      : startX + index * NODE_SPACING,
                  y: y,
                },
              };
            }
          });
        } else {
          // Child levels - position relative to parents
          const positionedNodes = new Set();

          levelNodes.forEach((node) => {
            if (positionedNodes.has(node.id)) return;

            const parentId = parentMap.get(node.id);
            const parent = layoutNodes.find((n) => n.id === parentId);

            if (parent) {
              // Get all siblings
              const siblings = (childrenMap.get(parentId) || [])
                .map((id) => levelNodes.find((n) => n.id === id))
                .filter(Boolean);

              // Position siblings horizontally around parent
              const siblingCount = siblings.length;
              const totalWidth = (siblingCount - 1) * NODE_SPACING;
              const startX = parent.position.x - totalWidth / 2;

              siblings.forEach((sibling, index) => {
                if (!positionedNodes.has(sibling.id)) {
                  const nodeIndex = layoutNodes.findIndex(
                    (n) => n.id === sibling.id
                  );
                  if (nodeIndex !== -1) {
                    layoutNodes[nodeIndex] = {
                      ...layoutNodes[nodeIndex],
                      position: {
                        x:
                          siblingCount === 1
                            ? parent.position.x
                            : startX + index * NODE_SPACING,
                        y: y,
                      },
                    };
                    positionedNodes.add(sibling.id);
                  }
                }
              });
            }
          });

          // Handle orphaned nodes
          levelNodes.forEach((node, index) => {
            if (!positionedNodes.has(node.id)) {
              const nodeIndex = layoutNodes.findIndex((n) => n.id === node.id);
              if (nodeIndex !== -1) {
                layoutNodes[nodeIndex] = {
                  ...layoutNodes[nodeIndex],
                  position: {
                    x: CENTER_X + index * NODE_SPACING,
                    y: y,
                  },
                };
              }
            }
          });
        }
      });

    console.log("✅ Smart layout applied successfully");
    return layoutNodes;
  };

  // ✅ Load questions (automatically uses partner context from API)
  const loadQuestionsFromDatabase = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(
        "🔄 Loading questions from database for partner:",
        uniquePartnerId
      );

      const response = await questionAPI.getAll(); // API automatically uses partner context
      console.log("📡 Raw API response:", response);

      let questions = [];
      if (response && response.data) {
        questions = Array.isArray(response.data)
          ? response.data
          : [response.data];
      } else if (Array.isArray(response)) {
        questions = response;
      } else {
        console.error("❌ Unexpected response format:", response);
        throw new Error("Invalid response format from API");
      }

      console.log("📋 Processed questions:", questions);
      console.log("📊 Questions count:", questions.length);

      if (!questions || questions.length === 0) {
        console.log("⚠️ No questions found, creating start node");
        createStartNode();
        return;
      }

      const visualNodes = convertQuestionsToNodes(questions);
      const visualConnections = generateConnectionsFromQuestions(questions);

      // Apply smart auto-layout
      const smartLayoutNodes = applySmartLayout(visualNodes, visualConnections);

      console.log(
        "🎨 Generated visual nodes with smart layout:",
        smartLayoutNodes
      );
      console.log("🔗 Generated connections:", visualConnections);

      setNodes(smartLayoutNodes);
      setConnections(visualConnections);
    } catch (error) {
      console.error("❌ Error loading questions from database:", error);
      setError(error.message);
      createStartNode();
    } finally {
      setLoading(false);
    }
  }, [uniquePartnerId]); // Add uniquePartnerId as dependency

  useEffect(() => {
    loadQuestionsFromDatabase();
  }, [loadQuestionsFromDatabase]);

  // ✅ All your existing functions remain exactly the same (convertQuestionsToNodes, generateConnectionsFromQuestions, etc.)
  // I'll include the key ones here, but the rest stay unchanged:

  const convertQuestionsToNodes = (questions) => {
    return questions.map((question, index) => {
      console.log(`🔄 Converting question ${index + 1}:`, question);

      let nodeType = "message"; // Default fallback
      if (question.isFirst) {
        nodeType = "start";
      } else if (question.type === "choice") {
        nodeType = "multiple-choice";
      } else if (question.type === "data_collection") {
        nodeType = "data-collection";
      } else if (question.type === "message") {
        nodeType = "message";
      } else if (question.type === "end") {
        nodeType = "end";
      }

      // Handle both populated and non-populated nextQuestionId
      let nextQuestionId = null;
      if (question.nextQuestionId) {
        if (typeof question.nextQuestionId === "object") {
          // It's been populated by MongoDB - extract the _id
          nextQuestionId = question.nextQuestionId._id;
        } else {
          // It's just a string ID
          nextQuestionId = question.nextQuestionId;
        }
      }

      console.log(
        `  └─ Processed nextQuestionId: ${JSON.stringify(
          question.nextQuestionId
        )} → ${nextQuestionId}`
      );

      const visualNode = {
        id: question._id.toString(),
        type: nodeType,
        position: question.position || {
          x: 400,
          y: 150 + index * 200,
        },
        data: {
          text: question.text,
          questionType: question.type,
          options: question.options || [],
          dataCollection: question.dataCollection || {
            isRequired: false,
            dataType: "text",
            placeholder: "",
            validation: {
              minLength: 0,
              maxLength: 500,
              errorMessage: "",
            },
          },
          messageSettings: question.messageSettings || {
            autoAdvance: true,
            delay: 1500,
            showTypingIndicator: true,
          },
          isFirst: question.isFirst,
          nextQuestionId: nextQuestionId,
        },
      };

      console.log(`  └─ Created visual node:`, visualNode);
      return visualNode;
    });
  };

  const generateConnectionsFromQuestions = (questions) => {
    const connections = [];

    questions.forEach((question) => {
      console.log(`🔗 Processing connections for question:`, question._id);

      // PRIORITY 1: Check options array first (modern routing)
      if (question.options && question.options.length > 0) {
        console.log("🔄 Using options-based connections");
        question.options.forEach((option, index) => {
          let targetId = null;
          if (option.nextQuestionId) {
            if (typeof option.nextQuestionId === "object") {
              targetId = option.nextQuestionId._id;
            } else {
              targetId = option.nextQuestionId;
            }
          }

          if (targetId && targetId.toString().trim() !== "") {
            const connection = {
              id: `conn-${question._id}-option-${index}`,
              source: question._id.toString(),
              target: targetId.toString(),
              label: option.label || "Next",
              style: getConnectionStyle(question.type),
            };
            connections.push(connection);
            console.log(`  └─ Added option connection:`, connection);
          }
        });
      }

      // PRIORITY 2: Fallback to legacy nextQuestionId (simple routing)
      if (question.nextQuestionId) {
        let targetId = null;
        if (typeof question.nextQuestionId === "object") {
          // It's been populated - extract _id
          targetId = question.nextQuestionId._id;
        } else {
          // It's a string
          targetId = question.nextQuestionId;
        }

        if (targetId && targetId.toString().trim() !== "") {
          console.log("🔄 Using legacy nextQuestionId connection:", targetId);

          const connection = {
            id: `conn-${question._id}-next`,
            source: question._id.toString(),
            target: targetId.toString(),
            label: question.type === "message" ? "Auto-advance" : "Next",
            style: getConnectionStyle(question.type),
          };
          connections.push(connection);
          console.log(`  └─ Added legacy connection:`, connection);
        }
      }
    });

    console.log(`🔗 Total connections generated:`, connections.length);
    return connections;
  };

  // Helper function to check if a node is temporary
  const isTempNode = (nodeId) => {
    return (
      nodeId &&
      (nodeId.startsWith("temp-") ||
        nodeId === "start-node" ||
        nodeId === "temp-start-node")
    );
  };

  const createStartNode = () => {
    console.log("🏁 Creating fallback start node");
    const startNode = {
      id: "temp-start-node",
      type: "start",
      position: { x: 600, y: 150 },
      data: {
        text: "Welcome! How can we help you?",
        questionType: "message",
        isFirst: true,
        messageSettings: { autoAdvance: true, delay: 2000 },
        isTemporary: true,
      },
    };
    setNodes([startNode]);
    setConnections([]);
  };

  // Convert temp node to real node
  const convertTempNodeToReal = async (tempNode) => {
    try {
      console.log("🔄 Converting temp node to real node:", tempNode);

      const newNodeData = {
        text: tempNode.data.text,
        type: tempNode.data.questionType,
        nodeType: tempNode.type,
        position: tempNode.position,
        options: tempNode.data.options || [],
        dataCollection: tempNode.data.dataCollection,
        messageSettings: tempNode.data.messageSettings,
        isFirst: true,
        flowId: "default-flow",
      };

      const response = await questionAPI.create(newNodeData); // API automatically includes partner ID
      const savedQuestion = response.data || response;

      console.log("✅ Created real node:", savedQuestion);

      const realNode = {
        id: savedQuestion._id,
        type: tempNode.type,
        position: tempNode.position,
        data: {
          text: savedQuestion.text,
          questionType: savedQuestion.type,
          options: savedQuestion.options || [],
          dataCollection: savedQuestion.dataCollection,
          messageSettings: savedQuestion.messageSettings,
          isFirst: savedQuestion.isFirst,
        },
      };

      setNodes((prev) =>
        prev.map((n) => (n.id === tempNode.id ? realNode : n))
      );

      setConnections((prev) =>
        prev.map((c) => ({
          ...c,
          source: c.source === tempNode.id ? realNode.id : c.source,
          target: c.target === tempNode.id ? realNode.id : c.target,
        }))
      );

      return realNode;
    } catch (error) {
      console.error("❌ Error converting temp node:", error);
      throw error;
    }
  };

  // Manual layout refresh function
  const refreshLayout = () => {
    console.log("🔄 Refreshing layout...");
    const smartLayoutNodes = applySmartLayout(nodes, connections);
    setNodes(smartLayoutNodes);

    // Save new positions to database
    smartLayoutNodes.forEach(async (node) => {
      if (!isTempNode(node.id)) {
        try {
          await questionAPI.update(node.id, { position: node.position });
        } catch (error) {
          console.error("Error saving position:", error);
        }
      }
    });
  };

  const handleRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    loadQuestionsFromDatabase();
  };

  // Mouse handlers for dragging
  const handleMouseDown = (e) => {
    if (
      e.target === containerRef.current ||
      e.target === canvasRef.current ||
      e.target.classList.contains("canvas-background")
    ) {
      console.log("✅ Starting drag operation");
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setDragStartTransform({ x: viewportTransform.x, y: viewportTransform.y });
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setViewportTransform((prev) => ({
        ...prev,
        x: dragStartTransform.x + deltaX,
        y: dragStartTransform.y + deltaY,
      }));

      e.preventDefault();
      e.stopPropagation();
    },
    [isDragging, dragStart, dragStartTransform]
  );

  const handleMouseUp = useCallback(
    (e) => {
      if (isDragging) {
        console.log("🖱️ Mouse up - ending drag");
        setIsDragging(false);
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [isDragging]
  );

  const handleCanvasClick = (e) => {
    if (
      !isDragging &&
      (e.target === containerRef.current ||
        e.target === canvasRef.current ||
        e.target.classList.contains("canvas-background"))
    ) {
      setSelectedNode(null);
      setContextMenu(null);
    }
  };

  const handleCanvasRightClick = (e) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const x =
      (e.clientX - rect.left - viewportTransform.x) / viewportTransform.scale;
    const y =
      (e.clientY - rect.top - viewportTransform.y) / viewportTransform.scale;

    setContextMenu({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      canvasPosition: { x, y },
      parentNode: null,
    });
  };

  const handleNodeClick = (node, e) => {
    e.stopPropagation();
    setSelectedNode(node);
    setContextMenu(null);
  };

  const handleNodeRightClick = (node, e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();

    setContextMenu({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      canvasPosition: { x: node.position.x + 150, y: node.position.y + 50 },
      parentNode: node,
    });
  };

  const addNode = async (nodeType, position, parentNode) => {
    try {
      const newNodeData = {
        text: getDefaultNodeData(nodeType).text,
        type: getDefaultNodeData(nodeType).questionType,
        nodeType: nodeType,
        position: position || { x: 300, y: 200 },
        options: getDefaultNodeData(nodeType).options || [],
        dataCollection: getDefaultNodeData(nodeType).dataCollection,
        messageSettings: getDefaultNodeData(nodeType).messageSettings,
        flowId: "default-flow",
      };

      console.log("Creating new question:", newNodeData);

      const response = await questionAPI.create(newNodeData); // API automatically includes partner ID
      const savedQuestion = response.data || response;

      console.log("Created new question:", savedQuestion);

      const newVisualNode = {
        id: savedQuestion._id,
        type: nodeType,
        position: position || { x: 300, y: 200 },
        data: {
          text: savedQuestion.text,
          questionType: savedQuestion.type,
          options: savedQuestion.options || [],
          dataCollection: savedQuestion.dataCollection,
          messageSettings: savedQuestion.messageSettings,
          isFirst: savedQuestion.isFirst,
          nextQuestionId: savedQuestion.nextQuestionId,
        },
      };

      setNodes((prev) => {
        const updatedNodes = [...prev, newVisualNode];
        setTimeout(() => refreshLayout(), 100);
        return updatedNodes;
      });

      if (parentNode) {
        let actualParent = parentNode;
        if (isTempNode(parentNode.id)) {
          actualParent = await convertTempNodeToReal(parentNode);
        }

        const newConnection = {
          id: `conn-${actualParent.id}-${savedQuestion._id}`,
          source: actualParent.id,
          target: savedQuestion._id,
          label: actualParent.type === "choice" ? "Option" : "Next",
          style: getConnectionStyle(actualParent.type),
        };
        setConnections((prev) => [...prev, newConnection]);

        try {
          // Use hybrid routing for parent updates
          if (actualParent.data.questionType === "choice") {
            // For choice questions, add to options
            const updatedOptions = [
              ...(actualParent.data.options || []),
              {
                label: `New Option`,
                actionType: "next_question",
                nextQuestionId: savedQuestion._id,
                buttonStyle: { variant: "primary", size: "medium" },
              },
            ];
            await questionAPI.update(actualParent.id, {
              options: updatedOptions,
            });
          } else {
            // For non-choice questions, use nextQuestionId
            await questionAPI.update(actualParent.id, {
              nextQuestionId: savedQuestion._id,
            });
          }
          console.log("Updated parent question connection");
        } catch (updateError) {
          console.error("Error updating parent connection:", updateError);
        }
      }

      setContextMenu(null);
    } catch (error) {
      console.error("Error adding node:", error);
      alert("Error creating new question. Please check console and try again.");
    }
  };

  const getDefaultNodeData = (nodeType) => {
    const defaults = {
      "multiple-choice": {
        text: "Please select an option",
        questionType: "choice",
        options: [
          { label: "Option 1", actionType: "next_question" },
          { label: "Option 2", actionType: "next_question" },
        ],
      },
      "data-collection": {
        text: "Please provide the following information",
        questionType: "data_collection",
        dataCollection: {
          isRequired: true,
          dataType: "email",
          placeholder: "Enter your email...",
          validation: {
            minLength: 0,
            maxLength: 500,
            errorMessage: "Please enter a valid email address",
          },
        },
      },
      message: {
        text: "Here is some information for you",
        questionType: "message",
        messageSettings: {
          autoAdvance: true,
          delay: 2000,
          showTypingIndicator: true,
        },
      },
      end: {
        text: "Thank you for your time!",
        questionType: "end",
      },
    };
    return defaults[nodeType] || defaults["message"];
  };

  const getConnectionStyle = (sourceType) => {
    const styles = {
      choice: { color: "#8b5cf6", dasharray: "0" },
      message: { color: "#f59e0b", dasharray: "5,5" },
      data_collection: { color: "#10b981", dasharray: "0" },
      default: { color: "#6b7280", dasharray: "0" },
    };
    return styles[sourceType] || styles.default;
  };

  const editNode = (node) => {
    if (isTempNode(node.id)) {
      console.log(
        "⚠️ Attempting to edit temporary node, will convert to real node"
      );
    }

    setNodeEditor(node);
    setContextMenu(null);
  };

  const saveNode = async (updatedNode) => {
    try {
      console.log("💾 Saving node:", updatedNode.id);

      if (isTempNode(updatedNode.id)) {
        console.log("🔄 Converting temporary node to real node");
        await convertTempNodeToReal(updatedNode);
        setNodeEditor(null);
        return;
      }

      const updateData = {
        text: updatedNode.data.text,
        type: updatedNode.data.questionType,
        options: updatedNode.data.options,
        dataCollection: updatedNode.data.dataCollection,
        messageSettings: updatedNode.data.messageSettings,
        position: updatedNode.position,
        nextQuestionId: updatedNode.data.nextQuestionId || null,
      };

      console.log("Updating question:", updatedNode.id, updateData);

      await questionAPI.update(updatedNode.id, updateData); // API automatically includes partner ID
      console.log("Updated question in database");

      setNodes((prev) =>
        prev.map((n) => (n.id === updatedNode.id ? updatedNode : n))
      );
      setNodeEditor(null);

      // Refresh connections and layout after save
      setTimeout(() => {
        loadQuestionsFromDatabase();
      }, 100);
    } catch (error) {
      console.error("Error saving node:", error);
      alert("Error saving changes. Please check console and try again.");
    }
  };

  const deleteNode = async (nodeId) => {
    if (isTempNode(nodeId)) {
      alert("Cannot delete the start node. Add real questions to replace it.");
      return;
    }

    try {
      console.log("Deleting question:", nodeId);

      await questionAPI.delete(nodeId); // API automatically includes partner ID
      console.log("Deleted question from database");

      setNodes((prev) => {
        const filteredNodes = prev.filter((n) => n.id !== nodeId);
        setTimeout(() => {
          const remainingConnections = connections.filter(
            (c) => c.source !== nodeId && c.target !== nodeId
          );
          const layoutedNodes = applySmartLayout(
            filteredNodes,
            remainingConnections
          );
          setNodes(layoutedNodes);
        }, 100);
        return filteredNodes;
      });

      setConnections((prev) =>
        prev.filter((c) => c.source !== nodeId && c.target !== nodeId)
      );
      setSelectedNode(null);
      setContextMenu(null);
    } catch (error) {
      console.error("Error deleting node:", error);
      alert("Error deleting question. Please check console and try again.");
    }
  };

  const saveFlow = async () => {
    try {
      console.log("Current flow state (saved via individual operations):");
      console.log("Nodes:", nodes.length);
      console.log("Connections:", connections.length);
      alert("Flow is automatically saved as you make changes!");
    } catch (error) {
      console.error("Error saving flow:", error);
    }
  };

  const zoomIn = () => {
    setViewportTransform((prev) => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 2),
    }));
  };

  const zoomOut = () => {
    setViewportTransform((prev) => ({
      ...prev,
      scale: Math.max(prev.scale / 1.2, 0.3),
    }));
  };

  const resetView = () => {
    setViewportTransform({ x: 0, y: 0, scale: 1 });
  };

  // Global mouse event listeners with proper cleanup
  useEffect(() => {
    if (isDragging) {
      console.log("🖱️ Adding global mouse listeners");
      document.addEventListener("mousemove", handleMouseMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleMouseUp, { passive: false });
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    }

    return () => {
      console.log("🖱️ Removing global mouse listeners");
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (loading) {
    return (
      <div className="h-full bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">
          Loading your questions from database...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">
            Error loading questions:
          </div>
          <div className="text-slate-300 mb-4">{error}</div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-900 relative overflow-hidden">
      {/* Professional Header */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-slate-800/95 backdrop-blur border-b border-slate-700">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  Flow Builder
                </h1>
                <p className="text-xs text-slate-400">
                  Partner: {uniquePartnerId}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={refreshLayout}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm flex items-center space-x-1 transition-colors"
                title="Auto-arrange nodes to prevent overlaps"
              >
                <Grid className="w-4 h-4" />
                <span>Auto-Layout</span>
              </button>
              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm flex items-center space-x-1 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={saveFlow}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm flex items-center space-x-1 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center space-x-1 transition-colors">
                <Play className="w-4 h-4" />
                <span>Test</span>
              </button>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-slate-700 rounded-md">
              <button
                onClick={zoomOut}
                className="p-2 hover:bg-slate-600 text-slate-300 rounded-l-md"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-3 py-2 text-xs text-slate-300 min-w-[60px] text-center">
                {Math.round(viewportTransform.scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="p-2 hover:bg-slate-600 text-slate-300 rounded-r-md"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={resetView}
              className="p-2 hover:bg-slate-700 text-slate-300 rounded-md"
              title="Reset view to center"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Debug info */}
        {isDragging && (
          <div className="absolute top-full left-4 bg-green-600 text-white px-2 py-1 rounded text-xs z-40">
            Dragging: {viewportTransform.x.toFixed(0)},{" "}
            {viewportTransform.y.toFixed(0)}
          </div>
        )}
      </div>

      {/* Canvas container with proper event handling */}
      <div
        ref={containerRef}
        className={`w-full h-full pt-16 canvas-background ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onClick={handleCanvasClick}
        onContextMenu={handleCanvasRightClick}
        onMouseDown={handleMouseDown}
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.15) 1px, transparent 0)
          `,
          backgroundSize: `${20 * viewportTransform.scale}px ${
            20 * viewportTransform.scale
          }px`,
          backgroundPosition: `${viewportTransform.x}px ${viewportTransform.y}px`,
        }}
      >
        <div
          ref={canvasRef}
          className="relative w-full h-full canvas-background"
          style={{
            transform: `translate(${viewportTransform.x}px, ${viewportTransform.y}px) scale(${viewportTransform.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Professional SVG Connections */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ overflow: "visible" }}
          >
            <defs>
              {connections.map((connection) => {
                const style = connection.style || { color: "#6b7280" };
                return (
                  <marker
                    key={`arrow-${connection.id}`}
                    id={`arrow-${connection.id}`}
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="3"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <path d="M0,0 L0,6 L9,3 z" fill={style.color} />
                  </marker>
                );
              })}
            </defs>

            {connections.map((connection) => (
              <FlowConnection
                key={connection.id}
                connection={connection}
                nodes={nodes}
              />
            ))}
          </svg>

          {/* Professional Nodes */}
          {nodes.map((node) => (
            <FlowNode
              key={node.id}
              node={node}
              isSelected={selectedNode?.id === node.id}
              onClick={handleNodeClick}
              onRightClick={handleNodeRightClick}
              onEdit={() => editNode(node)}
              onDelete={() => deleteNode(node.id)}
            />
          ))}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onAddNode={(nodeType) =>
            addNode(
              nodeType,
              contextMenu.canvasPosition,
              contextMenu.parentNode
            )
          }
          onClose={() => setContextMenu(null)}
          parentNode={contextMenu.parentNode}
        />
      )}

      {/* Node Editor */}
      {nodeEditor && (
        <NodeEditor
          node={nodeEditor}
          onSave={saveNode}
          onClose={() => setNodeEditor(null)}
        />
      )}

      {/* Professional Status Bar with Debug Info */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur border-t border-slate-700 px-6 py-2">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center space-x-4">
            <span>🏢 {uniquePartnerId}</span>
            <span>{nodes.length} nodes</span>
            <span>{connections.length} connections</span>
            <span>
              Position: {viewportTransform.x.toFixed(0)},{" "}
              {viewportTransform.y.toFixed(0)}
            </span>
            <span>Zoom: {Math.round(viewportTransform.scale * 100)}%</span>
            {selectedNode && (
              <span className="text-blue-400">
                • {selectedNode.data.text.substring(0, 30)}...
              </span>
            )}
          </div>
          <div className="text-slate-500">
            Click & drag background to pan • Right-click to add nodes •
            Double-click to edit
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowCanvas;
