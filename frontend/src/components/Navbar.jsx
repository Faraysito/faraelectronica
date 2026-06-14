import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import LoginModal from "./LoginModal";
import CarritoModal from "./CarritoModal";
import HistorialModal from "./HistorialModal";
import { useCarrito } from "../context/CarritoContext";

function Navbar() {
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { cantidadTotal } = useCarrito();

  const enCatalogo =
    location.pathname === "/camaras" || location.pathname === "/calefaccion";

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUsuario(JSON.parse(userData));
  }, []);

  const handleLoginSuccess = (user) => setUsuario(user);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUsuario(null);
  };

  // El carrito está SIEMPRE visible. Si no hay sesión, al hacer click pedimos login.
  const handleClickCarrito = () => {
    if (usuario) {
      setMostrarCarrito(true);
    } else {
      setMostrarLogin(true);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');

        body { margin: 0; background: #0b0b0b; }

        .nav-island-container {
          position: fixed;
          top: 15px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          z-index: 2000;
          padding: 0 20px;
          pointer-events: none;
        }

        .nav-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          pointer-events: auto;
          width: 100%;
          max-width: 1000px;
        }

        .btn-volver {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 10px 30px rgba(0,0,0,0.6), inset 0 0 10px rgba(255,255,255,0.05);
          color: #f5c800;
          font-size: 1.1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .btn-volver:hover {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 15px rgba(245,200,0,0.2);
        }

        .navbar-fara {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 60px;
          padding: 0 30px;
          border-radius: 100px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
        }

        .navbar-fara:hover {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .navbar-marca {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.6rem;
          letter-spacing: 0.1em;
          color: #ffffff;
          text-decoration: none;
        }

        .navbar-marca span { color: #f5c800; }

        .navbar-acciones {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .navbar-btn-login {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          background: transparent;
          color: #f5c800;
          border: 1px solid #f5c800;
          padding: 8px 18px;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .navbar-btn-login:hover {
          background: #f5c800;
          color: #000;
          box-shadow: 0 0 15px rgba(245, 200, 0, 0.3);
        }

        .navbar-usuario {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          color: #ffffff;
          cursor: pointer;
        }

        .navbar-usuario span { color: #f5c800; }

        .navbar-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #f5c800;
        }

        .btn-icono {
          position: relative;
          width: 40px;
          height: 40px;
          background: transparent;
          border: 1px solid #f5c800;
          border-radius: 50%;
          color: #f5c800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .btn-icono:hover {
          background: #f5c800;
          color: #000;
          box-shadow: 0 0 15px rgba(245,200,0,0.3);
        }

        .carrito-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #f5c800;
          color: #000;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pop 0.2s ease;
        }

        @keyframes pop {
          0% { transform: scale(0.5); }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        .nav-spacer { height: 100px; }
      `}</style>

      <div className="nav-island-container">
        <div className="nav-wrapper">
          {enCatalogo && (
            <button className="btn-volver" onClick={() => navigate("/")}>
              ←
            </button>
          )}
          <nav className="navbar-fara">
            <Link className="navbar-marca" to="/">
              FARA<span>ELECTRONICA</span>
            </Link>

            <div className="navbar-acciones">
              {/* Historial: solo si hay sesión */}
              {usuario && (
                <button
                  className="btn-icono"
                  onClick={() => setMostrarHistorial(true)}
                  title="Mis compras"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 8v4l3 3" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </button>
              )}

              {/* Carrito: SIEMPRE visible (logueado o no) */}
              <button
                className="btn-icono"
                onClick={handleClickCarrito}
                title="Carrito"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {cantidadTotal > 0 && (
                  <span className="carrito-badge">{cantidadTotal}</span>
                )}
              </button>

              {usuario ? (
                <>
                  <div className="navbar-usuario">
                    {usuario.foto && (
                      <img
                        src={usuario.foto}
                        alt="avatar"
                        className="navbar-avatar"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    Hola, <span>{usuario.name}</span>
                  </div>
                  <button
                    className="navbar-btn-login"
                    onClick={handleLogout}
                    style={{ borderColor: "#444", color: "#888" }}
                  >
                    Salir
                  </button>
                </>
              ) : (
                <button
                  className="navbar-btn-login"
                  onClick={() => setMostrarLogin(true)}
                >
                  INICIAR SESIÓN
                </button>
              )}
            </div>
          </nav>
        </div>
      </div>

      <div className="nav-spacer"></div>

      {mostrarLogin && (
        <LoginModal
          onClose={() => setMostrarLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {mostrarCarrito && (
        <CarritoModal onClose={() => setMostrarCarrito(false)} />
      )}

      {mostrarHistorial && (
        <HistorialModal onClose={() => setMostrarHistorial(false)} />
      )}
    </>
  );
}

export default Navbar;
