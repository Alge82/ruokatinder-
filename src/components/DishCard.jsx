export default function DishCard({
  dish,
  selected = false,
  matchCount = 0,
  matchingFamilies = [],
  onClick,
  disabled = false,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-left card p-4 transition w-full ${
        selected
          ? 'ring-2 ring-leaf-600 border-leaf-600'
          : 'hover:shadow-lift hover:-translate-y-0.5'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-display font-semibold text-leaf-800 leading-tight">
          {dish.name}
        </h3>
        {matchCount > 0 && (
          <span className="pill-sun shrink-0">
            🤝 {matchCount}
          </span>
        )}
      </div>
      {dish.description && (
        <p className="text-sm text-leaf-600 leading-snug mb-3">
          {dish.description}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {dish.category && (
          <span className="pill-leaf">{dish.category}</span>
        )}
        {dish.tags?.map((t) => (
          <span key={t} className="pill-sky">
            {t}
          </span>
        ))}
      </div>
      {matchingFamilies.length > 0 && (
        <div className="mt-3 pt-3 border-t border-birch-100 text-xs text-leaf-600">
          <span className="font-medium">Tekee samaa: </span>
          {matchingFamilies.map((f) => f.name).join(', ')}
        </div>
      )}
    </button>
  )
}
