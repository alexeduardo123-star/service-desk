export default function ChartCard({ titulo, subtitulo, className = "", children }) {
  return (
    <section className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}>
      <h2 className="text-sm font-semibold text-gray-900">{titulo}</h2>
      {subtitulo && <p className="mb-3 text-xs text-gray-500">{subtitulo}</p>}
      {!subtitulo && <div className="mb-3" />}
      {children}
    </section>
  );
}
