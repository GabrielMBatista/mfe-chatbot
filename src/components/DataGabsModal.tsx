const DataGabsModal = ({
  position,
  content,
  onClose,
}: {
  position: { top: number; left: number; width: number; height: number };
  content: string;
  onClose: () => void;
}) => (
  <>
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        zIndex: 9999,
      }}
    />
    <div
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        width: position.width,
        height: position.height,
        background: "#fff",
        border: "1px solid #ccc",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        padding: 16,
        zIndex: 10000,
        overflowY: "auto",
        maxHeight: "80vh",
        maxWidth: "90vw",
      }}
    >
      <p style={{ margin: 0, fontSize: 14, lineHeight: "1.5" }}>{content}</p>
      <button
        onClick={onClose}
        style={{
          marginTop: 8,
          background: "none",
          border: "none",
          color: "#999",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        ✖
      </button>
    </div>
  </>
);

export default DataGabsModal;
