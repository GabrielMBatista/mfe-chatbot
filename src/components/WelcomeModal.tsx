const WelcomeModal = ({
  onClose,
  onStartTour,
  onEnableHighlightMode,
}: {
  onClose: () => void;
  onStartTour: () => void;
  onEnableHighlightMode: () => void;
}) => (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10000,
    }}
  >
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 24,
        maxWidth: 400,
        textAlign: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      }}
    >
      <h2 style={{ color: "#0028af", marginBottom: 16 }}>
        Bem-vindo ao portfólio de Gabriel Marques!
      </h2>
      <p style={{ fontSize: 14, lineHeight: "1.6", marginBottom: 16 }}>
        Sou o G•One, seu assistente interativo. 👋
        <br />
        Aqui estão algumas sugestões:
      </p>
      <ul style={{ textAlign: "left", paddingLeft: 20, marginBottom: 16 }}>
        <li>🗺️ Clique no botão abaixo para iniciar um tour guiado.</li>
        <li>
          ✨ Ative o modo destacado para interagir com elementos especiais.
        </li>
        <li>❓ Faça perguntas sobre os projetos ou tecnologias usadas.</li>
      </ul>
      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        <button
          onClick={onStartTour}
          style={{
            background: "#0028af",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Iniciar Tour
        </button>
        <button
          onClick={onEnableHighlightMode}
          style={{
            background: "#f1c40f",
            color: "#000",
            border: "none",
            padding: "10px 20px",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Ativar Modo Destacado
        </button>
      </div>
      <button
        onClick={onClose}
        style={{
          background: "none",
          color: "#0028af",
          border: "1px solid #0028af",
          padding: "10px 20px",
          borderRadius: 6,
          cursor: "pointer",
          marginTop: 12,
        }}
      >
        Fechar
      </button>
    </div>
  </div>
);

export default WelcomeModal;
