import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, lazy, Suspense } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Camaras from "./pages/Camaras";
import Calefaccion from "./pages/Calefaccion";
import PagoRetorno from "./pages/PagoRetorno";
import NoEncontrado from "./pages/NoEncontrado";
import PopupEmail from "./components/PopupEmail";
import RastreoPixel from "./components/RastreoPixel";
import { useTema } from "./context/ThemeContext";

const AdminStats = lazy(() => import("./pages/AdminStats"));
// la página de producto va en su propio chunk (como AdminStats)
const Producto = lazy(() => import("./pages/Producto"));

function AnimatedRoutes() {
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  const getDirection = (from, to) => {
    if (to === "/") return -100;
    return 100;
  };

  const direction = getDirection(prevPath.current, location.pathname);
  prevPath.current = location.pathname;

  const variants = {
    initial: { x: direction + "%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -direction + "%", opacity: 0 },
  };

  const wrap = (Comp) => (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.4 }}
    >
      {Comp}
    </motion.div>
  );

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={wrap(<Home />)} />
        <Route path="/camaras" element={wrap(<Camaras />)} />
        <Route path="/calefaccion" element={wrap(<Calefaccion />)} />
        <Route
          path="/producto/:id"
          element={wrap(
            <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
              <Producto />
            </Suspense>,
          )}
        />
        <Route path="/pago/retorno" element={wrap(<PagoRetorno />)} />
        <Route
          path="/admin/stats"
          element={wrap(
            <Suspense fallback={<div style={{ minHeight: "60vh" }} />}>
              <AdminStats />
            </Suspense>,
          )}
        />
        <Route path="*" element={wrap(<NoEncontrado />)} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const { tema, toggleTema } = useTema();

  return (
    <BrowserRouter>
      <RastreoPixel />
      <Navbar />
      <AnimatedRoutes />
      <Footer />
      <PopupEmail />
      <button
        className="theme-toggle"
        onClick={toggleTema}
        title={tema === "dark" ? "Modo claro" : "Modo oscuro"}
      >
        {tema === "dark" ? "☀️" : "🌙"}
      </button>
    </BrowserRouter>
  );
}

export default App;