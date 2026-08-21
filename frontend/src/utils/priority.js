// Helper for Priority Colors, Labels, and Borders across the entire application
export const getPriorityBadgeProps = (priority = "medium") => {
  const p = (priority || "").toString().toLowerCase().trim();
  switch (p) {
    case "high":
      return { label: "High", color: "#dc2626", bgcolor: "#fee2e2", border: "#fca5a5" };
    case "low":
      return { label: "Low", color: "#2563eb", bgcolor: "#dbeafe", border: "#93c5fd" };
    case "medium":
    default:
      return { label: "Medium", color: "#d97706", bgcolor: "#fef3c7", border: "#fde68a" };
  }
};
