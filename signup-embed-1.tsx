import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import TreatmentPlanSignupPageContent from "@/components/TreatmentPlanSignupPageContent";
import "@/app/globals.css";

const container = document.getElementById("signup-root");

if (!container) {
  throw new Error('Signup embed mount point not found: #signup-root');
}

const query = new URLSearchParams(window.location.search);
const treatmentName =
  container.getAttribute("data-treatment-name") ??
  query.get("treatmentName") ??
  "";
const id =
  container.getAttribute("data-treatment-id") ?? query.get("id") ?? "";

if (!treatmentName || !id) {
  throw new Error(
    "Missing treatment embed params. Provide data-treatment-name and data-treatment-id on #signup-root, or use ?treatmentName=...&id=... in the URL."
  );
}

createRoot(container).render(
  <StrictMode>
    <TreatmentPlanSignupPageContent
      treatmentName={treatmentName}
      id={id}
    />
  </StrictMode>
);
