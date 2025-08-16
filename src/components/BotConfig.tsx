"use client";

import { useEffect, useState } from "react";
import { CustomTour } from "@/components/CustomTour";
import { HelpCircle } from "lucide-react";

type AssistantProfile = {
  name: string;
  personality: string;
  avatarUrl?: string;
  avatarBase64?: string;
  model: string;
};

export default function ChatBotPage() {
  const [profile, setProfile] = useState<AssistantProfile>({
    name: "",
    personality: "",
    avatarUrl: "",
    avatarBase64: "",
    model: "gpt-3.5-turbo",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/assistant-profile")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setProfile(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const method = profile.name ? "PUT" : "POST";

    const res = await fetch("/api/assistant-profile", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    const data = await res.json();
    alert(data.error || "Salvo com sucesso!");
  };

  const [tourState, setTourState] = useState({
    run: false,
    steps: [
      { target: "h1", content: "Aqui você configura o assistente." },
      {
        target: "label:nth-of-type(1)",
        content: "Defina o nome do assistente.",
      },
      {
        target: "label:nth-of-type(2)",
        content: "Escolha a personalidade do assistente.",
      },
      {
        target: "label:nth-of-type(3)",
        content: "Adicione um avatar para o assistente.",
      },
      {
        target: "label:nth-of-type(4)",
        content: "Selecione o modelo da OpenAI.",
      },
      {
        target: "button",
        content: "Clique aqui para salvar as configurações.",
      },
    ],
  });

  const startTour = () => setTourState((prev) => ({ ...prev, run: true }));
  const handleTourComplete = () =>
    setTourState((prev) => ({ ...prev, run: false }));

  const [contextualTour, setContextualTour] = useState({
    run: false,
    steps: [
      {
        target: "h1",
        content: "Este é o título da página onde você configura o assistente.",
      },
    ],
  });

  const startContextualTour = () =>
    setContextualTour((prev) => ({ ...prev, run: true }));
  const handleContextualTourComplete = () =>
    setContextualTour((prev) => ({ ...prev, run: false }));

  if (loading) return <p>Carregando...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>
      <CustomTour
        steps={tourState.steps}
        isRunning={tourState.run}
        onComplete={handleTourComplete}
        onSkip={handleTourComplete}
      />
      <CustomTour
        steps={contextualTour.steps}
        isRunning={contextualTour.run}
        onComplete={handleContextualTourComplete}
        onSkip={handleContextualTourComplete}
      />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button
          onClick={startTour}
          style={{
            background: "#28a745",
            color: "#fff",
            border: "none",
            padding: "10px 16px",
            borderRadius: 8,
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          Iniciar Tour
        </button>
        <button
          onClick={startContextualTour}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <HelpCircle size={24} color="#28a745" />
        </button>
      </div>
      <h1>Configurar IA</h1>

      <label>Nome do Assistente:</label>
      <input
        value={profile.name}
        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        style={{ width: "100%", padding: 8, marginBottom: 12 }}
      />

      <label>Personalidade:</label>
      <input
        value={profile.personality}
        onChange={(e) =>
          setProfile({ ...profile, personality: e.target.value })
        }
        placeholder="Ex: bem-humorado, sério, profissional..."
        style={{ width: "100%", padding: 8, marginBottom: 12 }}
      />

      <label>Avatar (URL ou base64):</label>
      <input
        value={profile.avatarUrl}
        onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
        placeholder="https://imagem.png"
        style={{ width: "100%", padding: 8, marginBottom: 12 }}
      />

      <label>Modelo da OpenAI:</label>
      <select
        value={profile.model}
        onChange={(e) => setProfile({ ...profile, model: e.target.value })}
        style={{ width: "100%", padding: 8, marginBottom: 12 }}
      >
        <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
        <option value="gpt-4">gpt-4</option>
        <option value="gpt-4o">gpt-4o</option>
      </select>

      {profile.avatarUrl && (
        <img
          src={profile.avatarUrl}
          alt="Avatar"
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            marginBottom: 12,
          }}
        />
      )}

      <button
        onClick={handleSave}
        style={{
          background: "#0028af",
          color: "#fff",
          border: "none",
          padding: "10px 16px",
          borderRadius: 8,
          cursor: "pointer",
          width: "100%",
        }}
      >
        Salvar Configurações
      </button>
    </div>
  );
}
