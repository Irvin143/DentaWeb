import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../modules/login/login.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* <Route path="/administracion" element={<Panel />}>
          <Route index element={<PanelCitas/>}/>
          <Route path="rituales" element={<PanelRituales />} />
          <Route path="citas" element={<PanelCitas />} />
          <Route path="satori" element={<PanelSatori />} />
        </Route> */}


      </Routes>
    </BrowserRouter>
  );
}