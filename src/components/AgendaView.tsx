import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building2,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  Layers,
} from 'lucide-react';

export const AgendaView: React.FC = () => {
  const { receitas, despesas, cartoes, emprestimos, operacoes, selectedMemberId } = useFinance();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    dateStr: string;
    events: any[];
  } | null>(null);

  const [viewTab, setViewTab] = useState<'MES' | 'HOJE' | 'ESTA_SEMANA' | 'PROXIMA_SEMANA'>('MES');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper: Get all events mapped by YYYY-MM-DD
  const eventsByDate: Record<
    string,
    {
      tipo: 'RECEITA' | 'DESPESA' | 'EMPRESTIMO' | 'CARTAO';
      descricao: string;
      valor: number;
      status: string;
      raw: any;
    }[]
  > = {};

  const addEvent = (
    dateStr: string,
    tipo: 'RECEITA' | 'DESPESA' | 'EMPRESTIMO' | 'CARTAO',
    descricao: string,
    valor: number,
    status: string,
    raw: any
  ) => {
    if (!eventsByDate[dateStr]) eventsByDate[dateStr] = [];
    eventsByDate[dateStr].push({ tipo, descricao, valor, status, raw });
  };

  // Receitas (Verde)
  receitas.forEach((r) => {
    if (r.deletedAt) return;
    if (selectedMemberId !== 'TODOS' && r.integranteId !== selectedMemberId) return;
    addEvent(r.dataPrevista, 'RECEITA', r.descricao, r.valor, r.status, r);
  });

  // Despesas (Vermelho)
  despesas.forEach((d) => {
    if (d.deletedAt) return;
    if (selectedMemberId !== 'TODOS' && d.integranteId !== selectedMemberId) return;
    // If it's a card expense, it's counted in credit card color or expenses
    if (d.cartaoId) {
      addEvent(d.dataVencimento, 'CARTAO', d.descricao, d.valor, d.status, d);
    } else {
      addEvent(d.dataVencimento, 'DESPESA', d.descricao, d.valor, d.status, d);
    }
  });

  // Empréstimos & Operações (Laranja)
  emprestimos.forEach((e) => {
    if (e.status === 'Quitado') return;
    e.parcelas.forEach((p) => {
      addEvent(
        p.vencimento,
        'EMPRESTIMO',
        `${e.nomeOperacao} (Parc. ${p.numero})`,
        p.valor,
        p.status,
        { ...e, parcela: p }
      );
    });
  });

  // Calendar calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const todayMonth = () => setCurrentDate(new Date());

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  // Tab Filtering for quick views
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now
    .getDate()
    .toString()
    .padStart(2, '0')}`;

  const getDayListForQuickTab = () => {
    const allEvents: { dateStr: string; item: any }[] = [];
    Object.entries(eventsByDate).forEach(([dateStr, items]) => {
      items.forEach((item) => allEvents.push({ dateStr, item }));
    });
    allEvents.sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime());

    if (viewTab === 'HOJE') {
      return allEvents.filter((e) => e.dateStr === todayStr);
    } else if (viewTab === 'ESTA_SEMANA') {
      const todayTime = now.getTime();
      return allEvents.filter((e) => {
        const t = new Date(e.dateStr).getTime();
        const diffDays = Math.ceil((t - todayTime) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      });
    } else if (viewTab === 'PROXIMA_SEMANA') {
      const todayTime = now.getTime();
      return allEvents.filter((e) => {
        const t = new Date(e.dateStr).getTime();
        const diffDays = Math.ceil((t - todayTime) / (1000 * 60 * 60 * 24));
        return diffDays > 7 && diffDays <= 14;
      });
    }
    return [];
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Agenda Financeira
          </h1>
          <p className="text-xs text-stone-500">
            Calendário executivo de vencimentos e compromissos futuros
          </p>
        </div>

        {/* Color Legend (as explicitly requested: Verde, Vermelho, Laranja, Roxo) */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 rounded-xl border border-stone-200 text-xs shadow-2xs">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-emerald-900 font-semibold">Receitas</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span className="text-rose-900 font-semibold">Despesas</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span className="text-amber-900 font-semibold">Empréstimos</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
            <span className="text-purple-900 font-semibold">Cartão de Crédito</span>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs: Este Mês | Hoje | Esta Semana | Próxima Semana */}
      <div className="flex items-center gap-1.5 bg-stone-100/80 p-1 rounded-xl w-fit border border-stone-200/80">
        <button
          onClick={() => setViewTab('MES')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            viewTab === 'MES' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Visão Mensal
        </button>
        <button
          onClick={() => setViewTab('HOJE')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            viewTab === 'HOJE' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Hoje
        </button>
        <button
          onClick={() => setViewTab('ESTA_SEMANA')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            viewTab === 'ESTA_SEMANA'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Esta Semana
        </button>
        <button
          onClick={() => setViewTab('PROXIMA_SEMANA')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            viewTab === 'PROXIMA_SEMANA'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Próxima Semana
        </button>
      </div>

      {viewTab === 'MES' ? (
        /* Calendar Grid View */
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-stone-900">
                {monthNames[month]} de {year}
              </h2>
              <button
                onClick={todayMonth}
                className="text-xs text-orange-700 bg-orange-50 hover:bg-orange-100 font-semibold px-2 py-0.5 rounded-lg transition-colors"
              >
                Mês Atual
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-stone-400 uppercase tracking-wider mb-2">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty slots for month start */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-24 bg-stone-50/40 rounded-xl p-1.5 opacity-30" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day
                .toString()
                .padStart(2, '0')}`;
              const dayEvents = eventsByDate[dateStr] || [];
              const isToday = dateStr === todayStr;

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    if (dayEvents.length > 0) {
                      setSelectedDayEvents({ dateStr, events: dayEvents });
                    }
                  }}
                  className={`min-h-24 border rounded-xl p-1.5 flex flex-col justify-between transition-all cursor-pointer ${
                    isToday
                      ? 'border-orange-500 bg-orange-50/20'
                      : dayEvents.length > 0
                      ? 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-2xs'
                      : 'border-stone-100 bg-stone-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-orange-600 text-white'
                          : dayEvents.length > 0
                          ? 'text-stone-800'
                          : 'text-stone-400'
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] text-stone-500 font-semibold">
                        {dayEvents.length} {dayEvents.length === 1 ? 'item' : 'itens'}
                      </span>
                    )}
                  </div>

                  {/* Badges preview */}
                  <div className="space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev, idx) => (
                      <div
                        key={idx}
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded truncate ${
                          ev.tipo === 'RECEITA'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ev.tipo === 'DESPESA'
                            ? 'bg-rose-100 text-rose-800'
                            : ev.tipo === 'EMPRESTIMO'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-purple-100 text-purple-900'
                        }`}
                      >
                        {ev.descricao}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-stone-500 font-semibold pl-1 block">
                        +{dayEvents.length - 2} mais...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Quick Tab List View (Hoje / Esta Semana / Próxima Semana) */
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
          <h2 className="text-sm font-extrabold text-stone-900 mb-4 pb-2 border-b border-stone-100">
            {viewTab === 'HOJE'
              ? 'Compromissos de Hoje'
              : viewTab === 'ESTA_SEMANA'
              ? 'Compromissos para os Próximos 7 Dias'
              : 'Compromissos para a Próxima Semana (8 a 14 dias)'}
          </h2>

          <div className="space-y-2">
            {getDayListForQuickTab().length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">
                Nenhum compromisso financeiro para este período.
              </p>
            ) : (
              getDayListForQuickTab().map(({ dateStr, item }, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-stone-100 bg-stone-50/60 hover:bg-stone-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        item.tipo === 'RECEITA'
                          ? 'bg-emerald-500'
                          : item.tipo === 'DESPESA'
                          ? 'bg-rose-500'
                          : item.tipo === 'EMPRESTIMO'
                          ? 'bg-amber-500'
                          : 'bg-purple-600'
                      }`}
                    />
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">
                        {item.descricao}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Vencimento: {formatDate(dateStr)} • Status: {item.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-extrabold text-xs text-stone-900">
                    {formatCurrency(item.valor)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Day Details Modal */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-stone-100 bg-stone-50">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Compromissos do Dia
                </span>
                <h3 className="text-base font-extrabold text-stone-900">
                  {formatDate(selectedDayEvents.dateStr)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-2.5">
              {selectedDayEvents.events.map((ev, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-stone-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-3 h-3 rounded-full shrink-0 ${
                        ev.tipo === 'RECEITA'
                          ? 'bg-emerald-500'
                          : ev.tipo === 'DESPESA'
                          ? 'bg-rose-500'
                          : ev.tipo === 'EMPRESTIMO'
                          ? 'bg-amber-500'
                          : 'bg-purple-600'
                      }`}
                    />
                    <div>
                      <span className="text-xs font-bold text-stone-900 block leading-tight">
                        {ev.descricao}
                      </span>
                      <span className="text-[10px] text-stone-500 font-medium">
                        {ev.tipo} • {ev.status}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-stone-900">
                    {formatCurrency(ev.valor)}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-stone-100 bg-stone-50 text-right">
              <button
                onClick={() => setSelectedDayEvents(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
