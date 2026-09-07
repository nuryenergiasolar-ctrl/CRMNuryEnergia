import { useEffect, useState } from "react";

type Peca = {
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotate: number;
  cor: string;
};

const CORES = [
  "hsl(var(--chart-1, 150 60% 45%))",
  "#22c55e",
  "#f59e0b",
  "#3b82f6",
  "#ec4899",
  "#a855f7",
];

/** Chuva de confetes exibida ao fechar um orçamento. */
export function Confetes({ ativo, onFim }: { ativo: boolean; onFim?: () => void }) {
  const [pecas, setPecas] = useState<Peca[]>([]);

  useEffect(() => {
    if (!ativo) {
      setPecas([]);
      return;
    }
    setPecas(
      Array.from({ length: 120 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.6,
        size: 6 + Math.random() * 8,
        rotate: Math.random() * 360,
        cor: CORES[Math.floor(Math.random() * CORES.length)] as string,
      })),
    );
    const t = setTimeout(() => onFim?.(), 4200);
    return () => clearTimeout(t);
  }, [ativo, onFim]);

  if (!ativo) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      <style>{`
        @keyframes confete-cai {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg); opacity: 0.9; }
        }
      `}</style>
      {pecas.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            backgroundColor: p.cor,
            borderRadius: 2,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confete-cai ${p.duration}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
