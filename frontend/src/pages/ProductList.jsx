import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { getCategories, getProducts } from "../api";
import Pagination from "../components/Pagination";
import { Field } from "../components/Field";
import { ProductGrid } from "../components/ProductCard";
import { Alert, Loading, PageError } from "../components/Status";
import { pluralize } from "../format";

const SORT_OPTIONS = [
  ["name", "Name: A to Z"],
  ["-name", "Name: Z to A"],
  ["price", "Price: low to high"],
  ["-price", "Price: high to low"],
  ["-created_at", "Newest"],
];
const FILTER_KEYS = ["q", "category", "min_price", "max_price", "in_stock"];

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParameters = Object.fromEntries(searchParams);
  const [showFilters, setShowFilters] = useState(false);

  const categories = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const products = useQuery({
    queryKey: ["products", queryParameters],
    queryFn: () => getProducts(queryParameters),
    placeholderData: keepPreviousData,
  });

  const updateQueryParameters = (changes) => {
    const nextQueryParameters = { ...queryParameters, page: undefined, ...changes };
    setSearchParams(Object.fromEntries(Object.entries(nextQueryParameters).filter(([, value]) => value !== undefined && value !== "")));
  };

  const selectedCategory = categories.data?.find((category) => category.slug === queryParameters.category);
  const hasFilters = FILTER_KEYS.some((key) => queryParameters[key]);
  const clearFilters = () => setSearchParams(queryParameters.sort ? { sort: queryParameters.sort } : {});

  if (products.isError) return <PageError error={products.error} />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{selectedCategory?.name ?? "All Products"}</h1>
          <p className="mt-1 text-gray-600"><ResultCount productPage={products.data} searchQuery={queryParameters.q} /></p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-secondary px-4 py-2 md:hidden" onClick={() => setShowFilters((shown) => !shown)}>
            {showFilters ? "Hide filters" : "Filters"}
          </button>
          <label htmlFor="sort" className="text-sm text-gray-700">Sort by</label>
          <select id="sort" className="input w-auto" value={queryParameters.sort ?? "name"} onChange={(event) => updateQueryParameters({ sort: event.target.value })}>
            {SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        <aside className={`space-y-6 md:block ${showFilters ? "" : "hidden"}`}>
          <section className="card p-4 md:p-4">
            <h2 className="mb-3 text-lg font-semibold">Categories</h2>
            {categories.isError && <Alert>Could not load categories. Please refresh the page to try again.</Alert>}
            <ul className="space-y-1">
              <CategoryLink active={!queryParameters.category} onClick={() => updateQueryParameters({ category: undefined })} label="All Categories" />
              {categories.data?.map((category) => (
                <CategoryLink
                  key={category.id}
                  active={queryParameters.category === category.slug}
                  onClick={() => updateQueryParameters({ category: category.slug })}
                  label={category.name}
                  count={category.product_count}
                />
              ))}
            </ul>
          </section>
          <FilterForm key={searchParams.toString()} queryParameters={queryParameters} onApply={updateQueryParameters} onClear={hasFilters ? clearFilters : null} />
        </aside>

        <div className={`md:col-span-3 transition-opacity ${products.isPlaceholderData ? "opacity-60" : ""}`}>
          {products.isPending ? (
            <Loading />
          ) : products.data.results.length ? (
            <>
              <ProductGrid products={products.data.results} />
              <Pagination page={products.data.page} pageCount={products.data.num_pages} onChange={(page) => updateQueryParameters({ page })} />
            </>
          ) : (
            <div className="card py-12 text-center">
              <p className="text-lg text-gray-500">No products match your filters.</p>
              {hasFilters && <button type="button" className="link mt-3" onClick={clearFilters}>Clear all filters</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultCount({ productPage, searchQuery }) {
  if (!productPage) return null;
  if (!productPage.count) return "No products found";
  return (
    <>
      Showing {productPage.start_index}&ndash;{productPage.end_index} of {pluralize(productPage.count, "product")}
      {searchQuery && <> for &ldquo;{searchQuery}&rdquo;</>}
    </>
  );
}

function CategoryLink({ active, onClick, label, count }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={active || undefined}
        className={`flex w-full justify-between rounded px-3 py-2 text-left ${active ? "bg-red-100 font-semibold text-red-700" : "text-gray-700 hover:bg-gray-100"}`}
      >
        <span>{label}</span>
        {count !== undefined && <span className="text-gray-400">{count}</span>}
      </button>
    </li>
  );
}

function FilterForm({ queryParameters, onApply, onClear }) {
  const [values, setValues] = useState({
    q: queryParameters.q ?? "",
    min_price: queryParameters.min_price ?? "",
    max_price: queryParameters.max_price ?? "",
    in_stock: queryParameters.in_stock === "true",
  });
  const handleChange = (name) => (event) =>
    setValues({ ...values, [name]: event.target.type === "checkbox" ? event.target.checked : event.target.value });

  const handleSubmit = (event) => {
    event.preventDefault();
    onApply({ ...values, in_stock: values.in_stock ? "true" : undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-4 md:p-4">
      <h2 className="text-lg font-semibold">Filters</h2>
      <div>
        <label htmlFor="filter-q" className="label">Search</label>
        <input id="filter-q" type="search" className="input" value={values.q} onChange={handleChange("q")} placeholder="Search products..." />
      </div>
      <fieldset>
        <legend className="label">Price</legend>
        <div className="flex items-center gap-2">
          <input type="number" min="0" step="any" className="input" aria-label="Minimum price" placeholder="Min" value={values.min_price} onChange={handleChange("min_price")} />
          <span className="text-gray-400">&ndash;</span>
          <input type="number" min="0" step="any" className="input" aria-label="Maximum price" placeholder="Max" value={values.max_price} onChange={handleChange("max_price")} />
        </div>
      </fieldset>
      <Field type="checkbox" label="In stock only" checked={values.in_stock} onChange={handleChange("in_stock")} />
      <button type="submit" className="btn-primary w-full py-2">Apply filters</button>
      {onClear && <button type="button" onClick={onClear} className="link block w-full text-center text-sm">Clear all filters</button>}
    </form>
  );
}
