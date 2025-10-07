import React from "react";

const FlowConnection = ({ connection, nodes }) => {
  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);

  if (!sourceNode || !targetNode) return null;

  // Calculate connection points (accounting for node center positioning)
  const start = {
    x: sourceNode.position.x,
    y: sourceNode.position.y + 80, // Bottom of source node (accounting for node height)
  };

  const end = {
    x: targetNode.position.x,
    y: targetNode.position.y - 80, // Top of target node (accounting for node height)
  };

  // Create smooth curved path
  const controlPointOffset = Math.abs(end.y - start.y) / 3;
  const pathD = `
    M ${start.x},${start.y}
    C ${start.x},${start.y + controlPointOffset} 
      ${end.x},${end.y - controlPointOffset} 
      ${end.x},${end.y}
  `;

  // Get connection style
  const style = connection.style || { color: "#6b7280", dasharray: "0" };

  return (
    <>
      {/* Connection Path */}
      <path
        d={pathD}
        fill="none"
        stroke={style.color}
        strokeWidth="2"
        strokeDasharray={style.dasharray}
        className="transition-all duration-200"
        markerEnd={`url(#arrow-${connection.id})`}
        style={{
          filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
        }}
      />

      {/* Connection Label */}
      {connection.label && (
        <g>
          {/* Label background */}
          <rect
            x={start.x + (end.x - start.x) / 2 - 25}
            y={start.y + (end.y - start.y) / 2 - 10}
            width="50"
            height="20"
            fill="rgba(30, 41, 59, 0.9)"
            rx="10"
            ry="10"
          />
          {/* Label text */}
          <text
            x={start.x + (end.x - start.x) / 2}
            y={start.y + (end.y - start.y) / 2 + 4}
            fill="white"
            fontSize="11"
            fontWeight="500"
            textAnchor="middle"
            className="pointer-events-none select-none"
          >
            {connection.label}
          </text>
        </g>
      )}
    </>
  );
};

export default FlowConnection;
