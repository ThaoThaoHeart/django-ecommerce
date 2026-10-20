import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";

const navigationLinkClassName = ({ isActive }) => (isActive ? "text-red-400" : "hover:text-red-400");
const navigationButtonClassName = "rounded-lg bg-red-600 px-4 py-2 transition hover:bg-red-700";

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-gray-800 text-gray-300">
        <p className="container mx-auto px-4 py-6 text-center text-sm">&copy; 2026 Django E-commerce. All rights reserved.</p>
      </footer>
    </div>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { data: cart } = useCart();

  const handleSearch = (event) => {
    event.preventDefault();
    const searchQuery = new FormData(event.currentTarget).get("q").trim();
    navigate(searchQuery ? `/products?${new URLSearchParams({ q: searchQuery })}` : "/products");
  };

  return (
    <nav className="bg-gray-800 text-white">
      <div className="container mx-auto flex flex-wrap items-center gap-4 px-4 py-4">
        <Link to="/" className="mr-auto text-2xl font-bold md:mr-0">E-commerce</Link>

        <form onSubmit={handleSearch} role="search" className="order-last w-full md:order-none md:w-auto md:max-w-md md:flex-1">
          <input
            key={searchParams.get("q")}
            type="search"
            name="q"
            defaultValue={searchParams.get("q") ?? ""}
            placeholder="Search products..."
            aria-label="Search products"
            className="w-full rounded-lg bg-white px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </form>

        <ul className="flex items-center gap-4 md:ml-auto md:gap-6">
          <li className="hidden sm:block"><NavLink to="/products" end className={navigationLinkClassName}>Products</NavLink></li>
          <li>
            <NavLink to="/cart" className={(state) => `inline-flex items-center gap-2 ${navigationLinkClassName(state)}`}>
              Cart
              {cart?.item_count > 0 && (
                <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold leading-none text-white">{cart.item_count}</span>
              )}
            </NavLink>
          </li>
          {user ? (
            <>
              <li><NavLink to="/account" className={navigationLinkClassName}>Account</NavLink></li>
              <li>
                <button
                  type="button"
                  onClick={() => logout.mutate(undefined, { onSuccess: () => navigate("/") })}
                  className={navigationButtonClassName}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="hidden sm:block"><NavLink to="/register" className={navigationLinkClassName}>Register</NavLink></li>
              <li><Link to="/login" className={navigationButtonClassName}>Login</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
