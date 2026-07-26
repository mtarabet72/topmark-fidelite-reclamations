export default async ({ req, res, log }) => {
  log("Function app-actions démarrée — test de connexion OK");
  return res.json({ ok: true, message: "app-actions est en ligne" });
};
