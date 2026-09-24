import { BrowserRouter, Route, Routes } from "react-router-dom";
import Shell from "./components";
import { Ask, Classics, Digest, Discover, Gems, Home, MapPage, Taste, Venue } from "./pages";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="discover" element={<Discover />} />
          <Route path="ask" element={<Ask />} />
          <Route path="venue/:id" element={<Venue />} />
          <Route path="classics" element={<Classics />} />
          <Route path="gems" element={<Gems />} />
          <Route path="digest" element={<Digest />} />
          <Route path="map" element={<MapPage />} />
          <Route path="taste" element={<Taste />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
