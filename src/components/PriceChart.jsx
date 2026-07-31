import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

export default function PriceChart({ data }) {
  const formatted = data.map((entry, index) => ({
    name: entry.label === 'Start' ? 'Init' : `${index}`,
    price: entry.price
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-glow"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm uppercase tracking-[0.25em] text-white/60">Live price chart</div>
        <div className="text-xs text-white/50">Latest market pulse</div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#b8c3ff', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#0b101e', borderColor: '#28304d', color: '#fff' }} cursor={{ stroke: '#33d6ff', strokeDasharray: '3 3' }} />
            <Line type="monotone" dataKey="price" stroke="#33d6ff" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
