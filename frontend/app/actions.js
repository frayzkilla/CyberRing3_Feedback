"use server";

export async function submitLoyaltyReport(prevState, formData) {
  const name = formData.get("name");
  const department = formData.get("department");
  const loyaltyScore = formData.get("loyaltyScore");
  const report = formData.get("report");

  await new Promise((r) => setTimeout(r, 800));

  if (!name || !department) {
    return {
      success: false,
      error: "Товарищ, заполните все обязательные поля!",
    };
  }

  const score = parseInt(loyaltyScore) || 0;
  let classification;
  if (score >= 90) classification = "ОБРАЗЦОВЫЙ ТОВАРИЩ";
  else if (score >= 70) classification = "НАДЁЖНЫЙ ЭЛЕМЕНТ";
  else if (score >= 50) classification = "ТРЕБУЕТ НАБЛЮДЕНИЯ";
  else classification = "ПОДОЗРИТЕЛЬНЫЙ ЭЛЕМЕНТ";

  return {
    success: true,
    data: {
      registrationId: `LP-${Date.now().toString(36).toUpperCase()}`,
      name,
      department,
      score,
      classification,
      processedAt: new Date().toISOString(),
    },
  };
}

export async function runDiagnostics(prevState, formData) {
  const subsystem = formData.get("subsystem");

  await new Promise((r) => setTimeout(r, 1200));

  const subsystems = {
    reactor: {
      name: "Реактор «Коллектив-1»",
      status: "НОРМА",
      temperature: `${(Math.random() * 20 + 340).toFixed(1)}°C`,
      pressure: `${(Math.random() * 5 + 150).toFixed(1)} атм`,
      output: `${(Math.random() * 500 + 4500).toFixed(0)} МВт`,
      workers: Math.floor(Math.random() * 50 + 200),
    },
    polymer: {
      name: "Полимерный цех П-3",
      status: "НОРМА",
      temperature: `${(Math.random() * 10 + 85).toFixed(1)}°C`,
      batchRate: `${(Math.random() * 20 + 180).toFixed(0)} кг/ч`,
      defectRate: `${(Math.random() * 2).toFixed(2)}%`,
      workers: Math.floor(Math.random() * 30 + 80),
    },
    robotics: {
      name: "Цех робототехники Р-7",
      status: Math.random() > 0.3 ? "НОРМА" : "ВНИМАНИЕ",
      activeUnits: Math.floor(Math.random() * 100 + 400),
      malfunctions: Math.floor(Math.random() * 5),
      productionRate: `${(Math.random() * 10 + 90).toFixed(1)}%`,
      workers: Math.floor(Math.random() * 20 + 50),
    },
    security: {
      name: "Периметр безопасности",
      status: "НОРМА",
      cameras: Math.floor(Math.random() * 50 + 350),
      alerts: Math.floor(Math.random() * 3),
      accessEvents: Math.floor(Math.random() * 200 + 800),
      workers: Math.floor(Math.random() * 10 + 40),
    },
    network: {
      name: "Сеть «Коллектив 2.0»",
      status: "НОРМА",
      nodes: Math.floor(Math.random() * 100 + 500),
      bandwidth: `${(Math.random() * 500 + 9500).toFixed(0)} Мбит/с`,
      latency: `${(Math.random() * 5 + 1).toFixed(1)} мс`,
      uptime: `${(99 + Math.random() * 0.99).toFixed(3)}%`,
    },
  };

  const result = subsystems[subsystem];
  if (!result) {
    return {
      success: false,
      error: `Подсистема «${subsystem}» не найдена в реестре`,
    };
  }

  return {
    success: true,
    data: {
      ...result,
      checkedAt: new Date().toISOString(),
      checkedBy: "СИСТЕМА «КОЛЛЕКТИВ 2.0»",
    },
  };
}

export async function submitFeedback(prevState, formData) {
  const category = formData.get("category");
  const message = formData.get("message");
  const anonymous = formData.get("anonymous") === "on";

  await new Promise((r) => setTimeout(r, 600));

  if (!message || message.length < 10) {
    return {
      success: false,
      error: "Сообщение должно содержать не менее 10 символов, товарищ.",
    };
  }

  return {
    success: true,
    data: {
      ticketId: `FB-${Date.now().toString(36).toUpperCase()}`,
      category: category || "general",
      anonymous,
      receivedAt: new Date().toISOString(),
      message:
        "Ваше обращение зарегистрировано и передано в соответствующий отдел.",
    },
  };
}

export async function checkSystemStatus() {
  await new Promise((r) => setTimeout(r, 500));

  return {
    overall: "OPERATIONAL",
    version: "2.0.3826",
    uptime: `${Math.floor(Math.random() * 1000 + 5000)} часов`,
    lastIncident: "2025-11-03T14:22:00Z",
    activeUsers: Math.floor(Math.random() * 500 + 1000),
    pendingRequests: Math.floor(Math.random() * 50 + 10),
    serverTime: new Date().toISOString(),
  };
}
