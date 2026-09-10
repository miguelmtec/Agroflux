import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatDate } from '../utils/formatters';
import { FileText, Download, Eye, Paperclip, Search, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export const DocumentosView: React.FC = () => {
  const { despesas, receitas } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');

  // Collect all attachments from despesas and receitas
  interface DocumentoItem {
    id: string;
    nomeArquivo: string;
    tipoLancamento: 'Despesa' | 'Receita';
    descricaoLancamento: string;
    data: string;
    url: string;
  }

  const docs: DocumentoItem[] = [];

  despesas.forEach((d) => {
    if (d.anexos && d.anexos.length > 0) {
      d.anexos.forEach((a, idx) => {
        docs.push({
          id: `${d.id}-${idx}`,
          nomeArquivo: a,
          tipoLancamento: 'Despesa',
          descricaoLancamento: d.descricao,
          data: d.dataVencimento,
          url: '#',
        });
      });
    }
  });

  receitas.forEach((r) => {
    if (r.anexos && r.anexos.length > 0) {
      r.anexos.forEach((a, idx) => {
        docs.push({
          id: `${r.id}-${idx}`,
          nomeArquivo: a,
          tipoLancamento: 'Receita',
          descricaoLancamento: r.descricao,
          data: r.dataPrevista,
          url: '#',
        });
      });
    }
  });

  const filtered = docs.filter(
    (d) =>
      d.nomeArquivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.descricaoLancamento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Documentos & Comprovantes Fiscais
          </h1>
          <p className="text-xs text-stone-500">
            Armazenamento seguro de notas fiscais, notas de produtor, recibos e contratos vinculados aos lançamentos
          </p>
        </div>

        <div className="text-xs font-bold text-stone-700 bg-stone-100 px-3 py-1.5 rounded-xl">
          {docs.length} documentos anexados
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-stone-400" />
        <input
          type="text"
          placeholder="Buscar documento por nome do arquivo ou lançamento associado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs focus:outline-hidden"
        />
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-stone-400 text-xs bg-white rounded-2xl border border-stone-200">
            Nenhum documento encontrado. Você pode anexar comprovantes ao cadastrar novos lançamentos.
          </div>
        ) : (
          filtered.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-start justify-between gap-3 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <h3 className="text-xs font-bold text-stone-900 truncate">
                    {doc.nomeArquivo}
                  </h3>
                  <p className="text-[11px] text-stone-500 truncate mt-0.5">
                    Vinculado: {doc.descricaoLancamento}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-stone-400">
                    <span className="bg-stone-100 px-1.5 py-0.2 rounded font-medium text-stone-600">
                      {doc.tipoLancamento}
                    </span>
                    <span>{formatDate(doc.data)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => alert(`Visualizando documento: ${doc.nomeArquivo}`)}
                  className="p-1.5 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Visualizar documento"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
