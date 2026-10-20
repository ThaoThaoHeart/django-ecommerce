import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

import * as api from "./api";
import { routes } from "./router";

vi.mock("./api", async (importOriginal) => {
  const actualModule = await importOriginal();
  const mockedFunctions = Object.fromEntries(Object.keys(actualModule).filter((name) => name !== "errorsOf").map((name) => [name, vi.fn()]));
  return { ...actualModule, ...mockedFunctions };
});

const product = {
  id: 1, name: "Snare Drum", slug: "snare-drum", description: "Punchy.", price: "100.00", stock: 5, in_stock: true,
  image: null, category: { name: "Drums", slug: "drums" },
};

const britishColumbia = { code: "BC", name: "British Columbia", tax_rate: 0.12, shipping_cost: 12 };

function cartForProvince(province) {
  return {
    items: [{ id: 7, product_title: "Snare Drum", selected_variations: "Color: Black", quantity: 2, unit_price: "100.00", line_total: "200.00", error: "", product }],
    item_count: 2, has_errors: false, province,
    subtotal: "200.00", tax: province ? "24.00" : "0.00", shipping_cost: province ? "12.00" : "0.00", total: province ? "236.00" : "200.00",
  };
}

const apiError = (errors) => Object.assign(new Error("Bad Request"), { response: { status: 400, data: { errors } } });

function renderAt(path) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

beforeEach(() => {
  api.getMe.mockResolvedValue(null);
  api.getCart.mockImplementation((province) => Promise.resolve(cartForProvince(province ?? null)));
  api.getCategories.mockResolvedValue([{ id: 1, name: "Drums", slug: "drums", product_count: 1 }]);
});

describe("product list", () => {
  it("drives search, category and pagination through the URL", async () => {
    const user = userEvent.setup();
    api.getProducts.mockResolvedValue({ count: 12, page: 1, num_pages: 2, start_index: 1, end_index: 9, results: [product] });
    const router = renderAt("/products?q=snare");

    expect(await screen.findByText(/Showing 1–9 of 12 products/)).toBeTruthy();
    expect(api.getProducts).toHaveBeenLastCalledWith({ q: "snare" });

    await user.click(screen.getByRole("button", { name: /^Drums/ }));
    expect(api.getProducts).toHaveBeenLastCalledWith({ q: "snare", category: "drums" });

    await user.click(await screen.findByRole("button", { name: "2" }));
    expect(api.getProducts).toHaveBeenLastCalledWith({ q: "snare", category: "drums", page: "2" });

    await user.selectOptions(screen.getByLabelText("Sort by"), "-price");
    expect(router.state.location.search).toBe("?q=snare&category=drums&sort=-price");
  });
});

describe("product detail", () => {
  beforeEach(() => {
    api.getProduct.mockResolvedValue({
      ...product,
      variation_groups: [{ category: "color", label: "Color", options: [{ id: 3, value: "Black" }, { id: 4, value: "Red" }] }],
      related: [],
    });
  });

  it("adds the chosen options to the cart and updates the navbar count", async () => {
    const user = userEvent.setup();
    api.addToCart.mockResolvedValue({ ...cartForProvince(null), item_count: 5 });
    renderAt("/products/snare-drum");

    await user.selectOptions(await screen.findByLabelText("Color"), "Red");
    await user.clear(screen.getByLabelText("Quantity"));
    await user.type(screen.getByLabelText("Quantity"), "2");
    await user.click(screen.getByRole("button", { name: "Add to Cart" }));

    expect(api.addToCart).toHaveBeenCalledWith({ product: "snare-drum", quantity: 2, variations: { color: 4 } }, expect.anything());
    expect(await screen.findByText(/Added Snare Drum to your cart/)).toBeTruthy();
    expect(within(screen.getByRole("navigation", { name: "" })).getByText("5")).toBeTruthy();
  });

  it("shows validation errors from the API", async () => {
    const user = userEvent.setup();
    api.addToCart.mockRejectedValue(apiError({ quantity: ["Only 5 available."] }));
    renderAt("/products/snare-drum");

    await user.click(await screen.findByRole("button", { name: "Add to Cart" }));
    expect(await screen.findByText("Only 5 available.")).toBeTruthy();
  });
});

describe("checkout", () => {
  it("sends anonymous shoppers to login and back", async () => {
    const router = renderAt("/checkout");
    expect(await screen.findByRole("heading", { name: "Login" })).toBeTruthy();
    expect(router.state.location.search).toBe("?next=%2Fcheckout");
  });

  it("walks through every step and places the order", async () => {
    const user = userEvent.setup();
    api.getMe.mockResolvedValue({ id: 1, email: "ada@example.com", date_joined: "2026-01-01T00:00:00Z" });
    api.getProvinces.mockResolvedValue([britishColumbia]);
    api.validateCheckout
      .mockResolvedValueOnce({ valid: true })
      .mockRejectedValueOnce(apiError({ billing: { postal_code: ["Enter a valid Canadian postal code, e.g. A1A 1A1."] } }))
      .mockResolvedValue({ valid: true });
    api.placeOrder.mockResolvedValue({ id: 5 });
    api.getOrder.mockResolvedValue({
      id: 5, number: "000005", created_at: "2026-09-27T12:00:00Z", province_name: "British Columbia",
      billing_address: { full_name: "Ada", address_line_1: "1 Main St", city: "Vancouver", postal_code: "V6B 1A1" },
      shipping_address: { full_name: "Ada", address_line_1: "1 Main St", city: "Vancouver", postal_code: "V6B 1A1" },
      cardholder_name: "Ada", card_last4: "4242", subtotal: "200.00", tax: "24.00", shipping_cost: "12.00", total: "236.00",
      items: cartForProvince("BC").items,
    });
    const router = renderAt("/checkout");

    await screen.findByRole("option", { name: /British Columbia/ });
    await user.selectOptions(screen.getByLabelText("Province"), "BC");
    expect(await screen.findByText("$236.00")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Continue to address/ }));

    await user.type(await screen.findByLabelText("Full name"), "Ada");
    await user.type(screen.getByLabelText("Address"), "1 Main St");
    await user.type(screen.getByLabelText("City"), "Vancouver");
    await user.type(screen.getByLabelText("Postal code"), "nope");
    await user.click(screen.getByRole("button", { name: /Continue to payment/ }));
    expect(await screen.findByText(/valid Canadian postal code/)).toBeTruthy();
    await user.clear(screen.getByLabelText("Postal code"));
    await user.type(screen.getByLabelText("Postal code"), "V6B 1A1");
    await user.click(screen.getByRole("button", { name: /Continue to payment/ }));

    await user.type(await screen.findByLabelText("Name on card"), "Ada");
    await user.type(screen.getByLabelText("Card number"), "4242 4242 4242 4242");
    await user.type(screen.getByLabelText("Expiry month"), "12");
    await user.type(screen.getByLabelText("Expiry year"), "2099");
    await user.type(screen.getByLabelText("CVV"), "123");
    await user.click(screen.getByRole("button", { name: /Continue to review/ }));

    expect(await screen.findByText(/Card ending in 4242, expires 12\/2099/)).toBeTruthy();
    expect(screen.getAllByText(/Vancouver, British Columbia V6B 1A1/).length).toBe(1);
    await user.click(screen.getByRole("button", { name: /Place order/ }));

    expect(api.placeOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        province: "BC",
        same_as_billing: true,
        billing: { full_name: "Ada", address_line_1: "1 Main St", city: "Vancouver", postal_code: "V6B 1A1" },
        payment: { cardholder_name: "Ada", card_number: "4242 4242 4242 4242", expiry_month: "12", expiry_year: "2099", cvv: "123" },
      }),
    );
    expect(await screen.findByText("Thank you! Your order has been placed.")).toBeTruthy();
    expect(router.state.location.pathname).toBe("/orders/5");
  });
});

describe("cart", () => {
  it("changes quantities and removes items", async () => {
    const user = userEvent.setup();
    api.updateCartItem.mockResolvedValue(cartForProvince(null));
    api.removeCartItem.mockResolvedValue(cartForProvince(null));
    renderAt("/cart");

    await user.click(await screen.findByRole("button", { name: "Increase quantity" }));
    expect(api.updateCartItem).toHaveBeenCalledWith(7, 3);
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(api.removeCartItem).toHaveBeenCalledWith(7, expect.anything());
  });

  it("shows an error page when the cart fails to load", async () => {
    api.getCart.mockRejectedValue(new Error("Network Error"));
    renderAt("/cart");
    expect(await screen.findByRole("heading", { name: "Something went wrong" })).toBeTruthy();
  });
});

describe("load failures", () => {
  const signedInUser = { id: 1, email: "ada@example.com", date_joined: "2026-01-01T00:00:00Z" };

  it("shows an error page when checkout cannot load the cart", async () => {
    api.getMe.mockResolvedValue(signedInUser);
    api.getProvinces.mockResolvedValue([britishColumbia]);
    api.getCart.mockRejectedValue(new Error("Network Error"));
    renderAt("/checkout");
    expect(await screen.findByRole("heading", { name: "Something went wrong" })).toBeTruthy();
  });

  it("tells the shopper when provinces cannot be loaded", async () => {
    api.getMe.mockResolvedValue(signedInUser);
    api.getProvinces.mockRejectedValue(new Error("Network Error"));
    renderAt("/checkout");
    expect(await screen.findByText(/Could not load provinces/)).toBeTruthy();
  });

  it("tells the shopper when their orders cannot be loaded", async () => {
    api.getMe.mockResolvedValue(signedInUser);
    api.getOrders.mockRejectedValue(new Error("Network Error"));
    renderAt("/account");
    expect(await screen.findByText(/Could not load your orders/)).toBeTruthy();
    expect(screen.queryByText(/haven't placed any orders/)).toBeNull();
  });

  it("tells the shopper when home page sections cannot be loaded", async () => {
    api.getCategories.mockRejectedValue(new Error("Network Error"));
    api.getProducts.mockRejectedValue(new Error("Network Error"));
    renderAt("/");
    expect(await screen.findByText(/Could not load categories/)).toBeTruthy();
    expect(await screen.findByText(/Could not load new arrivals/)).toBeTruthy();
  });

  it("tells the shopper when product list categories cannot be loaded", async () => {
    api.getCategories.mockRejectedValue(new Error("Network Error"));
    api.getProducts.mockResolvedValue({ count: 1, page: 1, num_pages: 1, start_index: 1, end_index: 1, results: [product] });
    renderAt("/products");
    expect(await screen.findByText(/Could not load categories/)).toBeTruthy();
  });
});

describe("account", () => {
  it("logs in, lists orders, and logs out", async () => {
    const user = userEvent.setup();
    api.login.mockResolvedValue({ id: 1, email: "ada@example.com", date_joined: "2026-01-01T00:00:00Z" });
    api.logout.mockResolvedValue(null);
    api.getOrders.mockResolvedValue([{ id: 5, number: "000005", created_at: "2026-09-27T12:00:00Z", item_count: 2, total: "236.00" }]);
    api.getProducts.mockResolvedValue({ count: 0, page: 1, num_pages: 1, start_index: 0, end_index: 0, results: [] });
    const router = renderAt("/login?next=%2Faccount");

    await user.type(await screen.findByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(api.login).toHaveBeenCalledWith({ email: "ada@example.com", password: "secret" }, expect.anything());
    expect(await screen.findByRole("link", { name: "#000005" })).toBeTruthy();
    expect(router.state.location.pathname).toBe("/account");

    await user.click(screen.getByRole("button", { name: "Logout" }));
    expect(await screen.findByRole("heading", { name: "Shop by category" })).toBeTruthy();
    expect(router.state.location.pathname).toBe("/");
  });

  it("shows login errors from the API", async () => {
    const user = userEvent.setup();
    api.login.mockRejectedValue(apiError({ __all__: ["Invalid email or password."] }));
    renderAt("/login");

    await user.type(await screen.findByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Login" }));
    expect(await screen.findByText("Invalid email or password.")).toBeTruthy();
  });
});
