import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { getTrackSummary } from "../lib/api";

export default function AdminAnalytics() {
  const { auth } = useAuth();
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    try {
      const r = await getTrackSummary(days, auth);
      setData(r);
    } catch (e) {
      setErr(String(e.message));
    }
  };

  useEffect(() => { load(); /* eslint-disable-line */ }, [days]);

  const byType = data?.countsByType || {};
  const top = data?.topClicks || [];
  const pv = data?.pageviewsByDay || [];

  return (
    <div className="p-6 grid gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Admin • Analytics</h1>
        <select value={days} onChange={e=>setDays(Number(e.target.value))} className="border p-1 rounded">
          <option value={1}>1 dia</option>
          <option value={7}>7 dias</option>
          <option value={30}>30 dias</option>
        </select>
        <button onClick={load} className="px-3 py-1 rounded bg-black text-white">Atualizar</button>
      </div>

      {err && <p className="text-red-600">{err}</p>}

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="border rounded-xl p-4">
          <div className="text-sm text-slate-600">Pageviews</div>
          <div className="text-3xl font-bold">{byType.PAGEVIEW ?? 0}</div>
        </div>
        <div className="border rounded-xl p-4">
          <div className="text-sm text-slate-600">Cliques</div>
          <div className="text-3xl font-bold">{byType.CLICK ?? 0}</div>
        </div>
        <div className="border rounded-xl p-4">
          <div className="text-sm text-slate-600">Visitantes únicos</div>
          <div className="text-3xl font-bold">{data?.uniqueIps ?? 0}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border rounded-xl p-4">
          <h2 className="font-semibold mb-2">Top cliques</h2>
          <ul className="space-y-1">
            {top.length === 0 && <li className="text-slate-600 text-sm">Sem dados</li>}
            {top.map((t) => (
              <li key={t.label} className="flex justify-between">
                <span>{t.label}</span><span className="font-semibold">{t.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border rounded-xl p-4">
          <h2 className="font-semibold mb-2">Pageviews por dia</h2>
          <ul className="space-y-1">
            {pv.length === 0 && <li className="text-slate-600 text-sm">Sem dados</li>}
            {pv.map((d) => (
              <li key={d.date} className="flex justify-between">
                <span>{d.date}</span><span className="font-semibold">{d.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
