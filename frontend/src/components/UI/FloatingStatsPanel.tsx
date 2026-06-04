import { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';

const chartData = [
  { area: 'Backend', salario: 4500, color: '#3b82f6' },  
  { area: 'Frontend', salario: 7200, color: '#f59e0b' }, 
  { area: 'DevOps', salario: 12000, color: '#10b981' },  
  { area: 'Data', salario: 5000, color: '#8b5cf6' },     
  { area: 'Mobile', salario: 6800, color: '#ef4444' },   
];

const seniorityData = [
  { name: 'Júnior', value: 2, color: '#3b82f6' },
  { name: 'Pleno', value: 2, color: '#10b981' },
  { name: 'Sênior', value: 1, color: '#f59e0b' },
];

const topStacks = [
  { name: 'Java', count: 2, percent: 100, color: 'bg-emerald-500' },
  { name: 'Spring Boot', count: 2, percent: 100, color: 'bg-emerald-500' },
  { name: 'React', count: 1, percent: 50, color: 'bg-blue-500' },
  { name: 'Python', count: 1, percent: 50, color: 'bg-yellow-500' },
];

export default function FloatingStatsPanel() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={`absolute top-6 left-6 z-10 transition-all duration-500 ease-in-out bg-[#121214]/85 backdrop-blur-md border border-gray-800/60 rounded-2xl shadow-2xl text-sm text-gray-300 pointer-events-auto flex flex-col
      ${isExpanded ? 'w-[420px] max-h-[calc(100vh-48px)]' : 'w-80 h-auto'}`}
    >
      
      {/* Header Fixo */}
      <div className="flex items-center justify-between p-5 pb-4 border-b border-gray-800/50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <h2 className="text-white font-bold tracking-wide text-sm">
            AceleraDev <span className="text-gray-500 font-normal ml-1">| REAL-TIME</span>
          </h2>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-400/10 px-2 py-1 rounded"
        >
          {isExpanded ? 'Minimizar' : 'Ver mais ↗'}
        </button>
      </div>

      {/* Conteúdo com Scroll Customizado */}
      <div className={`overflow-y-auto px-5 pb-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${!isExpanded ? 'pt-1' : 'pt-5'}`}>
        
        {/* Visão Compacta (Some ao expandir) */}
        {!isExpanded && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-4">
              <div className="text-2xl font-bold text-white flex items-baseline gap-2">
                5 <span className="text-xs text-emerald-400 font-normal">alunos ativos</span>
              </div>
              <div className="text-gray-500 text-xs mt-1">
                Média salarial: <span className="text-emerald-400">R$ 7.100</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Áreas</span>
                <div className="flex gap-2 text-white">
                  <span className="flex items-center gap-1">🔗 Backend (2)</span>
                  <span className="flex items-center gap-1">🎨 Frontend (1)</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Estados</span>
                <div className="flex gap-2 text-white">
                  <span className="flex items-center gap-1">🇧🇷 SP (1)</span>
                  <span className="flex items-center gap-1">🇧🇷 RJ (1)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visão Expandida (Dashboards Complexos) */}
        {isExpanded && (
          <div className="animate-in fade-in duration-500 flex flex-col gap-8">
            
            {/* Grid de KPIs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1a1a1e] p-3 rounded-lg border border-gray-800/50">
                <div className="text-gray-500 text-xs mb-1">Total Ativos</div>
                <div className="text-xl font-bold text-white">5 <span className="text-[10px] text-emerald-400 font-normal">alunos</span></div>
              </div>
              <div className="bg-[#1a1a1e] p-3 rounded-lg border border-gray-800/50">
                <div className="text-gray-500 text-xs mb-1">Salário Médio</div>
                <div className="text-xl font-bold text-emerald-400">R$ 7.100</div>
              </div>
              <div className="bg-[#1a1a1e] p-3 rounded-lg border border-gray-800/50">
                <div className="text-gray-500 text-xs mb-1">1º Emprego TI</div>
                <div className="text-xl font-bold text-white">40% <span className="text-[10px] text-emerald-400 font-normal">taxa</span></div>
              </div>
              <div className="bg-[#1a1a1e] p-3 rounded-lg border border-gray-800/50">
                <div className="text-gray-500 text-xs mb-1">Alcance</div>
                <div className="text-xl font-bold text-white">5 <span className="text-[10px] text-emerald-400 font-normal">estados</span></div>
              </div>
            </div>

            {/* Gráfico 1: Salário por Área */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm flex justify-between items-center">
                Salário por Área
                <span className="text-[10px] text-gray-500 font-normal">Em Reais (R$)</span>
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <XAxis dataKey="area" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                    <Tooltip 
                      cursor={{ fill: '#27272a' }}
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`R$ ${value}`, 'Salário Médio']}
                    />
                    <Bar dataKey="salario" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 2: Senioridade (Donut) */}
            <div>
              <h3 className="text-white font-semibold mb-2 text-sm">Distribuição de Senioridade</h3>
              <div className="flex items-center justify-between">
                <div className="h-32 w-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={seniorityData}
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {seniorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legenda do Donut */}
                <div className="flex flex-col gap-2 flex-1 pl-4">
                  {seniorityData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
                        <span className="text-gray-300">{item.name}</span>
                      </div>
                      <span className="text-white font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gráfico 3: Top Stacks (Barras Horizontais Customizadas) */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Top Tecnologias</h3>
              <div className="space-y-3">
                {topStacks.map((stack, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-gray-300 font-medium">{stack.name}</span>
                      <span className="text-gray-500">{stack.count} aluno(s)</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full ${stack.color} rounded-full`} style={{ width: `${stack.percent}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800/50 text-xs text-gray-500 text-center">
              Estes dados refletem a base em tempo real.
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}