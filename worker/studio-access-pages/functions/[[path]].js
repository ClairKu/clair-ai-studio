import worker from "../../studio-access-state/src/index.js";

export function onRequest(context) {
  return worker.fetch(context.request, context.env);
}
