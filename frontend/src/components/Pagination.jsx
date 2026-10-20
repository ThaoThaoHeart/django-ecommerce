const ELLIPSIS = "…";

function pageRange(currentPage, pageCount, neighbourCount = 1) {
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    if (pageNumber === 1 || pageNumber === pageCount || Math.abs(pageNumber - currentPage) <= neighbourCount) pages.push(pageNumber);
    else if (pages.at(-1) !== ELLIPSIS) pages.push(ELLIPSIS);
  }
  return pages;
}

export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  const buttonClassName = "rounded-lg border border-gray-300 bg-white px-3 py-2 hover:bg-gray-50";

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-1">
      {page > 1 && <button type="button" className={buttonClassName} onClick={() => onChange(page - 1)}>&larr; Prev</button>}
      {pageRange(page, pageCount).map((pageNumber, index) =>
        pageNumber === ELLIPSIS ? (
          <span key={`gap-${index}`} className="px-2 py-2 text-gray-500">{pageNumber}</span>
        ) : pageNumber === page ? (
          <span key={pageNumber} aria-current="page" className="rounded-lg bg-red-600 px-3 py-2 font-semibold text-white">{pageNumber}</span>
        ) : (
          <button key={pageNumber} type="button" className={buttonClassName} onClick={() => onChange(pageNumber)}>{pageNumber}</button>
        ),
      )}
      {page < pageCount && <button type="button" className={buttonClassName} onClick={() => onChange(page + 1)}>Next &rarr;</button>}
    </nav>
  );
}
