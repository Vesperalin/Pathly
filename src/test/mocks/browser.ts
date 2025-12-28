import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// Setup worker for browser environment (development/debugging)
export const worker = setupWorker(...handlers);
