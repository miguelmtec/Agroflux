import React from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  LayoutDashboard,
  Receipt,
  CalendarDays,
  ArrowDownCircle,
  ArrowUpCircle,
  Landmark,
  CreditCard,
  Building2,
  Tractor,
  Trees,
  Users,
  LineChart,
  FileSpreadsheet,
  FileText,
  Layers,
  Package,
  ShieldCheck,
  Settings,
  X,
  Repeat,
} from 'lucide-react';

interface SidebarProps {
  currentModule: string;
  onSelectModule: (module: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  isOpen,
  onClose,
}) => {
  const { despesas, receitas, usuarios, fazendas, currentUser, isMaster } = useFinance();

  // Badges calculation
  const pendingBillsCount = despesas.filter(
    (d) => !d.deletedAt && (d.status === 'A pagar' || d.status === 'Atrasado')
  ).length;

  const pendingRevenuesCount = receitas.filter(
    (r) => !r.deletedAt && (r.status === 'Prevista' || r.status === 'Atrasada')
  ).length;

  const pendingUsersCount = usuarios.filter((u) => u.status === 'Pendente').length;

  const navGroups: { label: string; items: any[] }[] = isMaster
    ? [
        {
          label: 'Painel Master',
          items: [{ id: 'painel-master', label: 'Meus Clientes', icon: ShieldCheck, badge: null }],
        },
      ]
    : [
        {
          label: 'Principal',
          items: [
            { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, badge: null },
            { id: 'lancamentos', label: 'Lançamentos', icon: Receipt, badge: null },
            { id: 'agenda', label: 'Agenda Financeira', icon: CalendarDays, badge: null },
          ],
        },
        {
          label: 'Contas e pagamentos',
          items: [
            {
              id: 'contas-pagar',
              label: 'Contas a Pagar',
              icon: ArrowDownCircle,
              badge: pendingBillsCount > 0 ? pendingBillsCount : null,
              badgeColor: 'bg-rose-100 text-rose-700',
            },
            {
              id: 'contas-receber',
              label: 'Contas a Receber',
              icon: ArrowUpCircle,
              badge: pendingRevenuesCount > 0 ? pendingRevenuesCount : null,
              badgeColor: 'bg-emerald-100 text-emerald-700',
            },
            { id: 'bancos', label: 'Bancos & Contas', icon: Landmark, badge: null },
            { id: 'cartoes', label: 'Cartões & Faturas', icon: CreditCard, badge: null },
            { id: 'emprestimos', label: 'Empréstimos & Operações', icon: Building2, badge: null },
            { id: 'recorrencias', label: 'Recorrências', icon: Repeat, badge: null },
            { id: 'fluxo-caixa', label: 'Fluxo de Caixa', icon: LineChart, badge: null },
            { id: 'plano-contas', label: 'Plano de Contas', icon: Layers, badge: null },
          ],
        },
        {
          label: 'Fazenda',
          items: [
            {
              id: 'fazendas',
              label: 'Fazendas & Usuários',
              icon: Trees,
              badge: `${fazendas.length} faz.`,
              badgeColor: 'bg-emerald-100 text-emerald-800 font-bold',
            },
            { id: 'compras-estoque', label: 'Compras & Estoque', icon: Package, badge: null },
          ],
        },
        {
          label: 'Família e relatórios',
          items: [
            { id: 'grupo-familiar', label: 'Grupo Familiar', icon: Users, badge: null },
            { id: 'relatorios', label: 'Relatórios', icon: FileSpreadsheet, badge: null },
            { id: 'documentos', label: 'Documentos', icon: FileText, badge: null },
            {
              id: 'administracao',
              label: 'Administração',
              icon: ShieldCheck,
              badge: pendingUsersCount > 0 ? `${pendingUsersCount} pend.` : null,
              badgeColor: 'bg-amber-100 text-amber-800 font-bold',
            },
          ],
        },
      ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 z-50 lg:z-10 h-full lg:h-[calc(100vh-4rem)] w-64 bg-white border-r border-stone-200 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'transtone-x-0' : '-transtone-x-full lg:transtone-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-100 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌾</span>
            <span className="font-extrabold text-stone-900 text-sm">AGROFLUX</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentModule === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectModule(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? 'text-emerald-400' : 'text-stone-400 group-hover:text-stone-600'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive
                              ? 'bg-emerald-500 text-stone-950'
                              : item.badgeColor || 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-stone-100 bg-stone-50/50">
          <div className="bg-white p-2.5 rounded-xl border border-stone-200/80 text-[11px]">
            <div className="text-stone-500 flex items-center justify-between">
              <span>Grupo Familiar:</span>
              <span className="font-semibold text-stone-700">Leão Ribeiro</span>
            </div>
            <div className="text-stone-500 flex items-center justify-between mt-1">
              <span>Perfil Ativo:</span>
              <span className="font-semibold text-orange-700">
                {currentUser?.perfil || 'Visitante'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
