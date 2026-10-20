import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

const responseData = (request) => request.then((response) => response.data);

export const getMe = () => responseData(api.get("/auth/me/")).then((body) => body.user);
export const login = (credentials) => responseData(api.post("/auth/login/", credentials)).then((body) => body.user);
export const register = (details) => responseData(api.post("/auth/register/", details)).then((body) => body.user);
export const logout = () => responseData(api.post("/auth/logout/")).then((body) => body.user);

export const getCategories = () => responseData(api.get("/categories/"));
export const getProducts = (queryParameters) => responseData(api.get("/products/", { params: queryParameters }));
export const getProduct = (slug) => responseData(api.get(`/products/${slug}/`));

export const getCart = (province) => responseData(api.get("/cart/", { params: province ? { province } : {} }));
export const addToCart = (line) => responseData(api.post("/cart/items/", line));
export const updateCartItem = (id, quantity) => responseData(api.patch(`/cart/items/${id}/`, { quantity }));
export const removeCartItem = (id) => responseData(api.delete(`/cart/items/${id}/`));

export const getProvinces = () => responseData(api.get("/provinces/"));
export const validateCheckout = (payload, sections) => responseData(api.post("/checkout/validate/", { ...payload, sections }));
export const placeOrder = (payload) => responseData(api.post("/checkout/", payload));
export const getOrders = () => responseData(api.get("/orders/"));
export const getOrder = (id) => responseData(api.get(`/orders/${id}/`));

export function errorsOf(error) {
  return error?.response?.data?.errors ?? { __all__: ["Something went wrong. Please try again."] };
}
