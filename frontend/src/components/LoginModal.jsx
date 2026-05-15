import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";

function LoginModal({ onClose, onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://faraelectronica-backend.onrender.com";

  const handleLogin = async (credential) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/google/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credential }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error en la autenticación");
        setLoading(false);
        return;
      }

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("user", JSON.stringify(data.user));

      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError("Error de conexión con el servidor");
      console.error("Error:", err);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

        .login-modal-box {
          background: linear-gradient(135deg, #111 0%, #1a1a1a 100%);
          border: 1px solid #2a2a00;
          border-radius: 8px;
          padding: 40px 36px;
          max-width: 480px;
          width: 100%;
          text-align: center;
          position: relative;
          overflow: hidden;
          box-shadow: 0 12px 40px rgba(245, 200, 0, 0.1);
        }

        .login-modal-box::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #f5c800, transparent);
        }

        .login-titulo {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2rem;
          color: #f5f5f5;
          letter-spacing: 0.08em;
          margin: 0 0 16px;
        }

        .login-titulo span {
          color: #f5c800;
        }

        .login-texto {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          color: #888;
          font-weight: 300;
          line-height: 1.8;
          margin: 0 0 28px;
        }

        .login-google-btn {
          width: 100%;
          margin-bottom: 16px;
        }

        .login-google-btn > div {
          display: flex !important;
          justify-content: center !important;
        }

        .login-btn-close {
          width: 100%;
          padding: 10px;
          background: transparent;
          border: 1px solid #444;
          color: #888;
          border-radius: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .login-btn-close:hover {
          border-color: #666;
          color: #aaa;
        }

        .login-error {
          background: #ff4444;
          color: #fff;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
        }
      `}</style>

      <div
        style={{ position: "relative" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="login-modal-box">
          <h2 className="login-titulo">
            Inicia <span>Sesión</span>
          </h2>
          <p className="login-texto">
            estamos trabajando para traer las funcionalidades al iniciar sesion
          </p>

          {error && <div className="login-error">⚠️ {error}</div>}

          <div className="login-google-btn">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                handleLogin(credentialResponse.credential);
              }}
              onError={() => setError("Error al iniciar sesión con Google")}
              size="large"
              width="100%"
            />
          </div>

          <br />

          <button onClick={onClose} className="login-btn-close">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
