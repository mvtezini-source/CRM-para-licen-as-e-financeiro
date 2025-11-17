import React, { useEffect, useState } from 'react';
import api from '../services/apiService';

export default function Reports() {
  const [reportType, setReportType] = useState('revenue');
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReport();
  }, [reportType, period]);

  async function loadReport() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:4000/api/reports/${reportType}?period=${period}`);
      if (!response.ok) throw new Error('Erro ao carregar relatório');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
      setData(null);
    }
    setLoading(false);
  }

  function downloadPDF() {
    const element = document.getElementById('report-content');
    const opt = {
      margin: 10,
      filename: `relatorio-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    // Nota: usar html2pdf library
    alert('PDF será gerado com html2pdf library');
  }

  function downloadCSV() {
    if (!data) return;
    
    let csv = 'Relatório de ' + reportType + '\n';
    csv += 'Período: ' + period + '\n\n';
    
    if (reportType === 'revenue') {
      csv += 'Mês,Receita,Pagamentos,Pendentes\n';
      data.months?.forEach(m => {
        csv += `${m.month},${m.revenue},${m.received},${m.pending}\n`;
      });
    } else if (reportType === 'churn') {
      csv += 'Mês,Total,Cancelados,Taxa\n';
      data.months?.forEach(m => {
        csv += `${m.month},${m.total},${m.canceled},${m.rate}%\n`;
      });
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${reportType}.csv`;
    a.click();
  }

  return (
    <div className="crm-card" style={{maxWidth:'1200px'}}>
      <h2>📊 Relatórios e Analytics</h2>

      <div style={{display:'flex', gap:'16px', marginBottom:'24px', flexWrap:'wrap'}}>
        <div>
          <label style={{display:'block', marginBottom:'6px', fontWeight:'bold'}}>Tipo de Relatório</label>
          <select 
            value={reportType} 
            onChange={e => setReportType(e.target.value)}
            style={{padding:'8px', borderRadius:'6px', border:'1px solid #ddd'}}
          >
            <option value="revenue">💰 Receita</option>
            <option value="churn">📉 Churn de Clientes</option>
            <option value="forecasting">🔮 Previsões</option>
            <option value="licenses">🔑 Licenças</option>
            <option value="payments">💳 Pagamentos</option>
          </select>
        </div>

        <div>
          <label style={{display:'block', marginBottom:'6px', fontWeight:'bold'}}>Período</label>
          <select 
            value={period} 
            onChange={e => setPeriod(e.target.value)}
            style={{padding:'8px', borderRadius:'6px', border:'1px solid #ddd'}}
          >
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
            <option value="quarter">Último Trimestre</option>
            <option value="year">Último Ano</option>
            <option value="all">Todos os Tempos</option>
          </select>
        </div>

        <div style={{display:'flex', gap:'8px', alignSelf:'flex-end'}}>
          <button 
            onClick={downloadPDF}
            style={{padding:'8px 16px', backgroundColor:'#e74c3c', color:'white', border:'none', borderRadius:'6px', cursor:'pointer'}}
          >
            📄 PDF
          </button>
          <button 
            onClick={downloadCSV}
            style={{padding:'8px 16px', backgroundColor:'#27ae60', color:'white', border:'none', borderRadius:'6px', cursor:'pointer'}}
          >
            📋 CSV
          </button>
        </div>
      </div>

      {error && (
        <div style={{backgroundColor:'#f8d7da', color:'#721c24', padding:'12px', borderRadius:'6px', marginBottom:'16px'}}>
          ⚠️ {error}
        </div>
      )}

      {loading && <div style={{textAlign:'center', padding:'24px'}}>⏳ Carregando relatório...</div>}

      {data && !loading && (
        <div id="report-content">
          {/* Relatório de Receita */}
          {reportType === 'revenue' && (
            <div>
              <h3>💰 Relatório de Receita</h3>
              
              <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'16px', marginBottom:'24px'}}>
                <div style={{backgroundColor:'#d4edda', padding:'16px', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#666'}}>Total Faturado</div>
                  <div style={{fontSize:'24px', fontWeight:'bold', color:'#28a745'}}>
                    R$ {data.totalRevenue?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </div>
                </div>
                
                <div style={{backgroundColor:'#cce5ff', padding:'16px', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#666'}}>Total Recebido</div>
                  <div style={{fontSize:'24px', fontWeight:'bold', color:'#0056b3'}}>
                    R$ {data.totalReceived?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </div>
                </div>
                
                <div style={{backgroundColor:'#fff3cd', padding:'16px', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#666'}}>Pendente</div>
                  <div style={{fontSize:'24px', fontWeight:'bold', color:'#ff9800'}}>
                    R$ {data.totalPending?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </div>
                </div>
                
                <div style={{backgroundColor:'#f0f0f0', padding:'16px', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#666'}}>Taxa de Conversão</div>
                  <div style={{fontSize:'24px', fontWeight:'bold', color:'#333'}}>
                    {data.conversionRate || '0'}%
                  </div>
                </div>
              </div>

              <h4>Evolução Mensal</h4>
              <table style={{width:'100%', borderCollapse:'collapse', marginBottom:'24px'}}>
                <thead>
                  <tr style={{backgroundColor:'#f5f5f5'}}>
                    <th style={{padding:'12px', textAlign:'left', borderBottom:'2px solid #ddd'}}>Mês</th>
                    <th style={{padding:'12px', textAlign:'right', borderBottom:'2px solid #ddd'}}>Faturado</th>
                    <th style={{padding:'12px', textAlign:'right', borderBottom:'2px solid #ddd'}}>Recebido</th>
                    <th style={{padding:'12px', textAlign:'right', borderBottom:'2px solid #ddd'}}>Pendente</th>
                    <th style={{padding:'12px', textAlign:'right', borderBottom:'2px solid #ddd'}}>Taxa %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.months?.map((m, i) => (
                    <tr key={i} style={{borderBottom:'1px solid #eee'}}>
                      <td style={{padding:'12px'}}>{m.month}</td>
                      <td style={{padding:'12px', textAlign:'right'}}>R$ {m.revenue?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                      <td style={{padding:'12px', textAlign:'right'}}>R$ {m.received?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                      <td style={{padding:'12px', textAlign:'right'}}>R$ {m.pending?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                      <td style={{padding:'12px', textAlign:'right', fontWeight:'bold', color: m.rate >= 80 ? '#28a745' : '#ff9800'}}>
                        {m.rate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Relatório de Churn */}
          {reportType === 'churn' && (
            <div>
              <h3>📉 Análise de Churn</h3>
              
              <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px', marginBottom:'24px'}}>
                <div style={{backgroundColor:'#f8d7da', padding:'16px', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#666'}}>Taxa de Churn</div>
                  <div style={{fontSize:'24px', fontWeight:'bold', color:'#721c24'}}>
                    {data.churnRate}%
                  </div>
                </div>
                
                <div style={{backgroundColor:'#d1ecf1', padding:'16px', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#666'}}>Clientes Perdidos</div>
                  <div style={{fontSize:'24px', fontWeight:'bold', color:'#0c5460'}}>
                    {data.clientsLost}
                  </div>
                </div>
                
                <div style={{backgroundColor:'#d4edda', padding:'16px', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#666'}}>Clientes Ativos</div>
                  <div style={{fontSize:'24px', fontWeight:'bold', color:'#155724'}}>
                    {data.activeClients}
                  </div>
                </div>
              </div>

              <h4>Churn por Mês</h4>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{backgroundColor:'#f5f5f5'}}>
                    <th style={{padding:'12px', textAlign:'left', borderBottom:'2px solid #ddd'}}>Mês</th>
                    <th style={{padding:'12px', textAlign:'right', borderBottom:'2px solid #ddd'}}>Total</th>
                    <th style={{padding:'12px', textAlign:'right', borderBottom:'2px solid #ddd'}}>Cancelados</th>
                    <th style={{padding:'12px', textAlign:'right', borderBottom:'2px solid #ddd'}}>Taxa %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.months?.map((m, i) => (
                    <tr key={i} style={{borderBottom:'1px solid #eee'}}>
                      <td style={{padding:'12px'}}>{m.month}</td>
                      <td style={{padding:'12px', textAlign:'right'}}>{m.total} clientes</td>
                      <td style={{padding:'12px', textAlign:'right'}}>{m.canceled}</td>
                      <td style={{padding:'12px', textAlign:'right', fontWeight:'bold', color: m.rate > 5 ? '#dc3545' : '#28a745'}}>
                        {m.rate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Relatório de Previsões */}
          {reportType === 'forecasting' && (
            <div>
              <h3>🔮 Previsões para Próximos Meses</h3>
              
              <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px', marginBottom:'24px'}}>
                <div style={{backgroundColor:'#e7f3ff', padding:'16px', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#666'}}>Receita Prevista</div>
                  <div style={{fontSize:'24px', fontWeight:'bold', color:'#0056b3'}}>
                    R$ {data.forecastedRevenue?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </div>
                </div>
                
                <div style={{backgroundColor:'#e7f3ff', padding:'16px', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#666'}}>Clientes Previstos</div>
                  <div style={{fontSize:'24px', fontWeight:'bold', color:'#0056b3'}}>
                    {data.forecastedClients}
                  </div>
                </div>
                
                <div style={{backgroundColor:'#e7f3ff', padding:'16px', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#666'}}>Crescimento Estimado</div>
                  <div style={{fontSize:'24px', fontWeight:'bold', color: data.growthRate > 0 ? '#28a745' : '#dc3545'}}>
                    {data.growthRate}%
                  </div>
                </div>
              </div>

              <h4>Projeção para Próximos Meses</h4>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{backgroundColor:'#f5f5f5'}}>
                    <th style={{padding:'12px', textAlign:'left', borderBottom:'2px solid #ddd'}}>Mês</th>
                    <th style={{padding:'12px', textAlign:'right', borderBottom:'2px solid #ddd'}}>Receita Prevista</th>
                    <th style={{padding:'12px', textAlign:'right', borderBottom:'2px solid #ddd'}}>Clientes Previstos</th>
                    <th style={{padding:'12px', textAlign:'right', borderBottom:'2px solid #ddd'}}>Confiança</th>
                  </tr>
                </thead>
                <tbody>
                  {data.forecast?.map((f, i) => (
                    <tr key={i} style={{borderBottom:'1px solid #eee'}}>
                      <td style={{padding:'12px'}}>{f.month}</td>
                      <td style={{padding:'12px', textAlign:'right'}}>R$ {f.revenue?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                      <td style={{padding:'12px', textAlign:'right'}}>{f.clients}</td>
                      <td style={{padding:'12px', textAlign:'right'}}>
                        <div style={{width:'100%', height:'6px', backgroundColor:'#eee', borderRadius:'3px', overflow:'hidden'}}>
                          <div style={{width: f.confidence + '%', height:'100%', backgroundColor: f.confidence > 70 ? '#28a745' : '#ff9800'}}></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Relatório de Licenças */}
          {reportType === 'licenses' && (
            <div>
              <h3>🔑 Relatório de Licenças</h3>
              
              <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'16px', marginBottom:'24px'}}>
                <div style={{backgroundColor:'#d4edda', padding:'16px', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#666'}}>Ativas</div>
                  <div style={{fontSize:'24px', fontWeight:'bold', color:'#28a745'}}>
                    {data.activeLicenses}
                  </div>
                </div>
                
                <div style={{backgroundColor:'#fff3cd', padding:'16px', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#666'}}>Para Vencer</div>
                  <div style={{fontSize:'24px', fontWeight:'bold', color:'#ff9800'}}>
                    {data.expiringSoon}
                  </div>
                </div>
                
                <div style={{backgroundColor:'#f8d7da', padding:'16px', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#666'}}>Vencidas</div>
                  <div style={{fontSize:'24px', fontWeight:'bold', color:'#dc3545'}}>
                    {data.expired}
                  </div>
                </div>

                <div style={{backgroundColor:'#d1ecf1', padding:'16px', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#666'}}>Total</div>
                  <div style={{fontSize:'24px', fontWeight:'bold', color:'#0c5460'}}>
                    {data.totalLicenses}
                  </div>
                </div>
              </div>

              <h4>Distribuição por Plano</h4>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{backgroundColor:'#f5f5f5'}}>
                    <th style={{padding:'12px', textAlign:'left', borderBottom:'2px solid #ddd'}}>Plano</th>
                    <th style={{padding:'12px', textAlign:'right', borderBottom:'2px solid #ddd'}}>Ativas</th>
                    <th style={{padding:'12px', textAlign:'right', borderBottom:'2px solid #ddd'}}>Para Vencer</th>
                    <th style={{padding:'12px', textAlign:'right', borderBottom:'2px solid #ddd'}}>Vencidas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byPlan?.map((p, i) => (
                    <tr key={i} style={{borderBottom:'1px solid #eee'}}>
                      <td style={{padding:'12px'}}>{p.plan}</td>
                      <td style={{padding:'12px', textAlign:'right'}}>{p.active}</td>
                      <td style={{padding:'12px', textAlign:'right'}}>{p.expiring}</td>
                      <td style={{padding:'12px', textAlign:'right'}}>{p.expired}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Relatório de Pagamentos */}
          {reportType === 'payments' && (
            <div>
              <h3>💳 Relatório de Pagamentos</h3>
              
              <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'16px', marginBottom:'24px'}}>
                <div style={{backgroundColor:'#d4edda', padding:'16px', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#666'}}>Confirmados</div>
                  <div style={{fontSize:'24px', fontWeight:'bold', color:'#28a745'}}>
                    {data.confirmed}
                  </div>
                </div>
                
                <div style={{backgroundColor:'#fff3cd', padding:'16px', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#666'}}>Pendentes</div>
                  <div style={{fontSize:'24px', fontWeight:'bold', color:'#ff9800'}}>
                    {data.pending}
                  </div>
                </div>
                
                <div style={{backgroundColor:'#f8d7da', padding:'16px', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#666'}}>Vencidos</div>
                  <div style={{fontSize:'24px', fontWeight:'bold', color:'#dc3545'}}>
                    {data.overdue}
                  </div>
                </div>

                <div style={{backgroundColor:'#d1ecf1', padding:'16px', borderRadius:'8px', textAlign:'center'}}>
                  <div style={{fontSize:'12px', color:'#666'}}>Reembolsos</div>
                  <div style={{fontSize:'24px', fontWeight:'bold', color:'#0c5460'}}>
                    {data.refunded}
                  </div>
                </div>
              </div>

              <h4>Métodos de Pagamento</h4>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{backgroundColor:'#f5f5f5'}}>
                    <th style={{padding:'12px', textAlign:'left', borderBottom:'2px solid #ddd'}}>Método</th>
                    <th style={{padding:'12px', textAlign:'right', borderBottom:'2px solid #ddd'}}>Quantidade</th>
                    <th style={{padding:'12px', textAlign:'right', borderBottom:'2px solid #ddd'}}>Valor Total</th>
                    <th style={{padding:'12px', textAlign:'right', borderBottom:'2px solid #ddd'}}>Taxa Sucesso</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byMethod?.map((m, i) => (
                    <tr key={i} style={{borderBottom:'1px solid #eee'}}>
                      <td style={{padding:'12px'}}>{m.method}</td>
                      <td style={{padding:'12px', textAlign:'right'}}>{m.count}</td>
                      <td style={{padding:'12px', textAlign:'right'}}>R$ {m.total?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                      <td style={{padding:'12px', textAlign:'right'}}>{m.successRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
