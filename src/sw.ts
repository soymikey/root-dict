/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { shouldBypassCache } from "./lib/cachePolicy";

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("fetch", (event) => {
  if (!shouldBypassCache(event.request.url)) {
    return;
  }
  event.respondWith(fetch(event.request, { cache: "no-store" }));
});

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
registerRoute(new NavigationRoute(createHandlerBoundToURL("/index.html")));
