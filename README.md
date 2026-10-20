# Django E-commerce

A full-stack online music store built with a **Django REST API** and a **React** single-page frontend. Shoppers can browse and filter a catalog of instruments and software, pick product options like color or size, keep a cart with or without an account, and check out in four steps with Canadian provincial tax and shipping worked out automatically.

## Highlights

- **Full-stack app:** Django and Django REST Framework on the backend, React 19 with React Router, React Query, and Tailwind CSS on the frontend.
- **Product catalog:** keyword search, category and price filters, in-stock filter, sorting, and pagination. Products have options (color, size, key count, and more) and related products.
- **Carts for everyone:** visitors get a cart tied to their browser session. When they log in or sign up, it is merged into their account cart so nothing is lost.
- **Accurate pricing:** each cart line is checked against current catalog prices and stock. Tax and shipping are calculated for all 10 Canadian provinces, using `Decimal` so money is never rounded wrong.
- **Safe checkout:** four steps (Shipping, Address, Payment, Review), each validated by the server. Card numbers are checked with the Luhn algorithm, expired cards are rejected, and only the last 4 digits are stored.
- **No overselling:** orders are placed inside a database transaction that locks the product rows, so two shoppers cannot buy the last item at the same time.
- **Order history:** logged-in users can see their past orders and the details of each one.
- **Tested:** 28 backend tests (Django) and 14 frontend tests (Vitest and Testing Library).

## Tech Stack

| Area | Tools |
| --- | --- |
| Backend | Python, Django 6, Django REST Framework, SQLite, Pillow |
| Frontend | React 19, React Router 7, TanStack React Query, Axios, Tailwind CSS 4, Vite |
| Testing | Django test runner, Vitest, React Testing Library |
| Auth | Django session login with CSRF protection |

## Project Structure

```
accounts/        User sign up, login, logout
catalog/         Categories, products, product options, demo data command
carts/           Cart, pricing, tax and shipping, checkout, orders
djangoecommerce/ Project settings and API routing
frontend/        React app (pages, components, hooks, API client)
```

## Running It Locally

You need Python 3 and Node.js.

**1. Set up the backend**

```sh
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py populate_products   # loads a demo catalog of guitars, keyboards, drums, and software
python manage.py createsuperuser     # optional, for the admin site at /admin
```

**2. Set up the frontend**

```sh
cd frontend
npm install
```

**3. Start both servers** (in two terminals), then open http://localhost:5173

```sh
python manage.py runserver   # API on port 8000
cd frontend && npm run dev   # React app on port 5173
```

The React dev server forwards `/api`, `/media`, and `/admin` to Django. Because both run on the same address, the app can use Django's normal session and CSRF cookies for login and for guest carts.

## Running the Tests

```sh
python manage.py test        # backend
cd frontend && npm test      # frontend
```

## API Overview

All endpoints are under `/api/`.

| Endpoint | Methods | What it does |
| --- | --- | --- |
| `auth/me/`, `auth/login/`, `auth/register/`, `auth/logout/` | GET / POST | Session login; login and sign up merge the guest cart |
| `categories/` | GET | Categories with their product counts |
| `products/` | GET | Filters: `q`, `category`, `min_price`, `max_price`, `in_stock`, `sort`, `page`, `page_size` |
| `products/<slug>/` | GET | One product with its options and related products |
| `cart/` | GET | The current cart; add `?province=XX` for tax and shipping |
| `cart/items/`, `cart/items/<id>/` | POST / PATCH, DELETE | Add, update, or remove items; returns the updated cart |
| `provinces/` | GET | Tax rates and shipping costs |
| `checkout/validate/` | POST | Validate one checkout step |
| `checkout/` | POST | Place the order (login required) |
| `orders/`, `orders/<id>/` | GET | The current user's orders |
