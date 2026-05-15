import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Camaras from "./pages/Camaras";
import Calefaccion from "./pages/Calefaccion";

function AnimatedRoutes() {
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  const getDirection = (from, to) => {
    if (to === "/") return -100; // volver a home (hacia atrás)
    return 100; // avanzar
  };

  const direction = getDirection(prevPath.current, location.pathname);
  prevPath.current = location.pathname;

  const variants = {
    initial: { x: direction + "%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -direction + "%", opacity: 0 },
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4 }}
            >
              <Home />
            </motion.div>
          }
        />
        <Route
          path="/camaras"
          element={
            <motion.div
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4 }}
            >
              <Camaras />
            </motion.div>
          }
        />
        <Route
          path="/calefaccion"
          element={
            <motion.div
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4 }}
            >
              <Calefaccion />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <AnimatedRoutes />
      <Footer />
    </BrowserRouter>
  );
}

export default App;
