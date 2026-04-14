const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE || '5524999999999';

export function generateWhatsAppLink(booking) {
  const { clientName, serviceName, date } = booking;
  const dateStr = new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const timeStr = new Date(date).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  });

  const message =
    `Olá, gostaria de confirmar meu agendamento na Guaribada:\n` +
    `*Serviço:* ${serviceName}\n` +
    `*Data:* ${dateStr} às ${timeStr}\n` +
    `*Nome:* ${clientName}\n\n` +
    `Aguardo a confirmação. Obrigado! 🚗✨`;

  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(booking) {
  window.open(generateWhatsAppLink(booking), '_blank');
}
