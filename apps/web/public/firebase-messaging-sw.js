self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : { notification: { title: "Zeeshu Weather Alert", body: "New weather update" } };
  event.waitUntil(self.registration.showNotification(payload.notification.title, { body: payload.notification.body, icon: "/icon-192.png" }));
});
