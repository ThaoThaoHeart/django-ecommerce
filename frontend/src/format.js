const currencyFormatter = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol" });

export const formatMoney = (value) => currencyFormatter.format(Number(value));

export const formatDate = (value, options = { dateStyle: "medium" }) =>
  new Intl.DateTimeFormat("en-CA", options).format(new Date(value));

export const pluralize = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;
