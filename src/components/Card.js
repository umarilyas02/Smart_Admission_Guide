export default function Card({ title, description, icon, className = "" }) {
  return (
    <div
      className={`bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition duration-300 fade-in ${className}`}
    >
      {icon && <div className="text-3xl mb-2">{icon}</div>}
      <h3 className="text-xl font-semibold text-primary">{title}</h3>
      <p className="mt-2 text-gray-600">{description}</p>
    </div>
  );
}
