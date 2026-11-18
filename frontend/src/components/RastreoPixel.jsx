import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initPixel, track } from "../lib/metaPixel";

// PageView en cada cambio de ruta (sin VITE_META_PIXEL_ID no hace nada)
function RastreoPixel() {
  const { pathname } = useLocation();
  useEffect(() => {
    initPixel();
    track("PageView");
  }, [pathname]);
  return null;
}

export default RastreoPixel;
