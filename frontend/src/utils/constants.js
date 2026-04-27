export const STATUS_LIST = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

// Labels curtos (admin, listas)
export const STATUS_LABELS = {
  pending:     'Pendente',
  confirmed:   'Confirmado',
  in_progress: 'Em andamento',
  completed:   'Concluído',
  cancelled:   'Cancelado',
};

// Labels longos (tela do cliente)
export const STATUS_LABELS_LONG = {
  pending:     'Aguardando confirmação',
  confirmed:   'Confirmado ✓',
  in_progress: 'Em andamento',
  completed:   'Concluído',
  cancelled:   'Cancelado',
};

// Cores base (badges, textos)
export const STATUS_COLORS = {
  pending:     'text-yellow-400 bg-yellow-400/10',
  confirmed:   'text-[#25D366] bg-[#25D366]/10',
  in_progress: 'text-blue-400 bg-blue-400/10',
  completed:   'text-white/50 bg-white/5',
  cancelled:   'text-red-400 bg-red-400/10',
};

// Cores com borda (select do admin)
export const STATUS_COLORS_BORDER = {
  pending:     'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  confirmed:   'text-[#25D366] bg-[#25D366]/10 border-[#25D366]/30',
  in_progress: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  completed:   'text-white/50 bg-white/5 border-white/10',
  cancelled:   'text-red-400 bg-red-400/10 border-red-400/30',
};
