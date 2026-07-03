import { Link, Outlet } from "react-router-dom";
import { OPEN_DATA_URL } from "./types";

export function Layout() {
  return (
    <div className="layout">
      <header className="site-header">
        <p className="eyebrow">
          <Link to="/">COH3 analysis hub</Link>
        </p>
        <h1>Unit reference</h1>
        <p className="lede">
          Data-driven unit specs for strategy and analysis. Patch-pinned open data from COH3 Stats.
        </p>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>
          Unit data from{" "}
          <a href={OPEN_DATA_URL} rel="noopener noreferrer">
            COH3 Stats Open Data
          </a>
          . Not affiliated with Relic or SEGA.
        </p>
      </footer>
    </div>
  );
}
