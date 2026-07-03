import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./Layout";
import { HubPage } from "./pages/HubPage";
import { UnitDetailPage } from "./pages/UnitDetailPage";
import { UnitsListPage } from "./pages/UnitsListPage";

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/coh3"}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HubPage />} />
          <Route path="units" element={<UnitsListPage />} />
          <Route path="units/:faction/:category/:unitKey" element={<UnitDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
