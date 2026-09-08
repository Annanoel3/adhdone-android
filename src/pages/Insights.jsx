import { Navigate } from "react-router-dom";

// Insights was merged into the Progress page — keep the old route working.
export default function Insights() {
  return <Navigate to="/Progress" replace />;
}