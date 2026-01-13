import client from "./client";

export async function login(username, password) {
  const { data } = await client.post("/auth/login/", { username, password });
  // expects: { access: "...", refresh: "..." }
  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  return data;
}

export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

export function isLoggedIn() {
  return !!localStorage.getItem("access");
}