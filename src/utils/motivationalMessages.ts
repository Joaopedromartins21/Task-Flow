const messages = [
  "🌟 Excelente trabalho! Continue assim!",
  "🎯 Meta alcançada! Você está arrasando!",
  "💪 Mais uma conquista! Você é incrível!",
  "🚀 Nada pode te parar! Continue voando alto!",
  "⭐ Que produtividade incrível! Parabéns!",
  "🏆 Você é um(a) verdadeiro(a) campeão(ã)!",
  "✨ Brilhante como sempre! Continue brilhando!",
  "🌈 Mais um passo rumo ao sucesso!",
  "🎉 Comemore suas conquistas! Você merece!",
  "🌺 Florescendo a cada tarefa concluída!",
];

export function getRandomMessage(): string {
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}