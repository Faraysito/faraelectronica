import qr from "../assets/images/qrlinkedin.png";

function Footer() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
        .footer{background:#0a0a0a;border-top:1px solid #1f1f00;padding:20px 32px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
        .footer-marca{font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:0.1em;color:#f5f5f5}
        .footer-marca span{color:#f5c800}
        .footer-desc{font-family:'DM Sans',sans-serif;font-size:0.82rem;font-weight:300;color:#666;max-width:480px;line-height:1.5;margin:0}
        .footer-divider{width:40px;height:1px;background:#2a2a00;margin:2px 0}
        .footer-wsp{display:flex;align-items:center;gap:10px;font-family:'DM Sans',sans-serif;font-size:0.78rem;font-weight:500;letter-spacing:0.1em;color:#25d366;text-decoration:none;transition:opacity 0.2s}
        .footer-wsp:hover{opacity:0.8}
        .footer-copy{font-family:'DM Sans',sans-serif;font-size:0.72rem;color:#2a2a2a;letter-spacing:0.1em;margin:0;line-height:1.8}
        .footer-link-diego{color:inherit;text-decoration:none;transition:color 0.2s;cursor:pointer}
        .footer-link-diego:hover{color:#f5c800 !important}
        .footer-qr-wrapper{display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:4px}
        .footer-qr-link{display:inline-block;transition:opacity 0.2s}
        .footer-qr-link:hover{opacity:0.85}
        .footer-qr{width:80px;height:80px;object-fit:contain;border:1px solid #f5c800;border-radius:8px;padding:5px;background:rgba(245,200,0,0.04);box-shadow:0 0 12px rgba(245,200,0,0.08);transition:box-shadow 0.3s;cursor:pointer}
        .footer-qr:hover{box-shadow:0 0 20px rgba(245,200,0,0.18)}
        .footer-qr-label{font-family:'DM Sans',sans-serif;font-size:0.65rem;letter-spacing:0.15em;color:#444;text-transform:uppercase}
      `}</style>

      <footer className="footer">
        <div className="footer-marca">
          Fara<span>Electronica</span>
        </div>
        <p className="footer-desc">
          Somos una pequeña pyme familiar dedicada a la venta de tecnología de
          calidad. Cada producto que ofrecemos está elegido con cuidado, porque
          sabemos que nuestros clientes merecen lo mejor.
        </p>
        <div className="footer-divider" />
        <a
          href="https://wa.me/56940261248"
          target="_blank"
          rel="noreferrer"
          className="footer-wsp"
        >
          ● WhatsApp del vendedor para consultas: +56 9 4026 1248
        </a>
        <p className="footer-copy">
          © 2026 FaraElectronica — Todos los derechos reservados | <br />
          <a
            href="https://diegofarias-portafolio.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="footer-link-diego"
          >
            diseñado por diego farias <i className=""></i>
          </a>
          <br />
        </p>
        <div className="footer-qr-wrapper">
          <a
            href="https://www.linkedin.com/in/diego-ignacio-de-jesus-farias-araya-6927642a8/"
            target="_blank"
            rel="noreferrer"
            className="footer-qr-link"
          >
            <img src={qr} alt="QR LinkedIn" className="footer-qr" />
          </a>
          <span className="footer-qr-label">Pincha el QR para llevarte a mi linkedin</span>
        </div>
      </footer>
    </>
  );
}

export default Footer;
