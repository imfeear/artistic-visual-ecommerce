import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { FiArrowUpRight, FiActivity } from 'react-icons/fi';
import { EmptyState, Button } from './ui';

const colors = ['#7755b8', '#c24e80', '#348679', '#c79638', '#5675a0'];
const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e9e6ee',
  fontSize: 'var(--text-sm)',
  lineHeight: 'var(--leading-ui)',
};
function prettyLabel(meta = '') {
  const labels = {
    whatsapp_button: 'Contato pelo WhatsApp',
    nav_loja: 'Menu: loja',
    nav_destaques: 'Menu: destaques',
    nav_contato: 'Menu: contato',
    hero_arrow_left: 'Banner anterior',
    hero_arrow_right: 'Próximo banner',
    hero_loja: 'Hero: explorar loja',
  };
  if (meta.startsWith('search:')) return `Busca: ${meta.slice(7)}`;
  if (meta.startsWith('hero_dot_')) return `Banner ${meta.replace('hero_dot_', '')}`;
  return labels[meta] || meta || 'Outro';
}
export default function AnalyticsPanel({ summary, loading, error, onRetry, compact = false }) {
  const visits = summary?.pageviewsByDay || [];
  const top = (summary?.topClicks || []).map((item) => ({
    ...item,
    label: prettyLabel(item.label),
  }));
  const total = top.reduce((sum, item) => sum + item.count, 0);
  if (error)
    return (
      <EmptyState
        error
        title="Estatísticas indisponíveis"
        description={error}
        action={
          <Button variant="secondary" onClick={onRetry}>
            Tentar novamente
          </Button>
        }
      />
    );
  return (
    <div className={`analytics-grid ${compact ? 'analytics-compact' : ''}`}>
      <section className="panel chart-panel">
        <div className="panel-heading">
          <div>
            <h2>Visitas ao longo do tempo</h2>
            <p>Visualizações de página no período selecionado</p>
          </div>
          <FiActivity />
        </div>
        {loading ? (
          <div className="skeleton chart-skeleton" />
        ) : visits.length ? (
          <>
            <div
              className="chart-frame"
              role="img"
              aria-label={`Gráfico de visitas: ${visits.reduce((n, v) => n + v.count, 0)} visualizações no período`}
            >
              <ResponsiveContainer>
                <AreaChart data={visits} margin={{ top: 15, right: 15, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="traffic-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#7755b8" stopOpacity={0.22} />
                      <stop offset="1" stopColor="#7755b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#eeedf0" strokeDasharray="3 4" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => String(date).slice(5).split('-').reverse().join('/')}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 'var(--text-sm)', fill: '#787586' }}
                    minTickGap={32}
                    height={36}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 'var(--text-sm)', fill: '#787586' }}
                    width={44}
                  />
                  <Tooltip
                    labelFormatter={(date) => String(date).split('-').reverse().join('/')}
                    contentStyle={tooltipStyle}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Visitas"
                    stroke="#7755b8"
                    strokeWidth={3}
                    fill="url(#traffic-area)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <table className="sr-only">
              <caption>Visualizações por dia</caption>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.date}>
                    <th>{v.date}</th>
                    <td>{v.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <EmptyState
            title="A audiência começa por aqui"
            description="As visitas aparecerão conforme sua loja receber acessos."
          />
        )}
      </section>
      <section className="panel click-panel">
        <div className="panel-heading">
          <div>
            <h2>O que desperta interesse</h2>
            <p>Principais interações na loja</p>
          </div>
          <FiArrowUpRight />
        </div>
        {loading ? (
          <div className="skeleton chart-skeleton" />
        ) : top.length ? (
          <>
            {!compact && (
              <div
                className="donut-frame"
                role="img"
                aria-label={`Distribuição de ${total} cliques`}
              >
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={top}
                      dataKey="count"
                      nameKey="label"
                      innerRadius="65%"
                      outerRadius="88%"
                      paddingAngle={3}
                      isAnimationActive={false}
                    >
                      {top.map((item, i) => (
                        <Cell key={item.label} fill={colors[i % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-total">
                  <strong>{total}</strong>
                  <span>interações</span>
                </div>
              </div>
            )}
            <div className="click-list">
              {top.slice(0, compact ? 5 : 10).map((item, i) => (
                <div className="click-item" key={item.label}>
                  <div>
                    <span
                      className="legend-dot"
                      style={{ background: colors[i % colors.length] }}
                    />
                    <span>{item.label}</span>
                    <strong>{item.count}</strong>
                  </div>
                  <div className="click-track">
                    <span
                      style={{
                        width: `${total ? (item.count / total) * 100 : 0}%`,
                        background: colors[i % colors.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title="Cada clique conta"
            description="As interações com menus, banners e WhatsApp aparecerão aqui."
          />
        )}
      </section>
    </div>
  );
}
