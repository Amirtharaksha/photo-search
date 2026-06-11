import PhotoCard from './PhotoCard'

function groupByDate(photos) {
  const groups = {}
  photos.forEach(p => {
    const date = p.created_at
      ? new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'Unknown date'
    if (!groups[date]) groups[date] = []
    groups[date].push(p)
  })
  return Object.entries(groups)
}

export default function PhotoGrid({ photos, onDelete, onFavoriteToggle, showScore = false, groupByDateFlag = true }) {
  if (!photos.length) return null

  if (!groupByDateFlag || showScore) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
        {photos.map(p => (
          <PhotoCard key={p.id} photo={p} onDelete={onDelete} onFavoriteToggle={onFavoriteToggle} />
        ))}
      </div>
    )
  }

  const grouped = groupByDate(photos)

  return (
    <div className="space-y-6">
      {grouped.map(([date, datePhotos]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-[#202124] mb-2 sticky top-16 bg-white py-1 z-10">
            {date}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
            {datePhotos.map(p => (
              <PhotoCard key={p.id} photo={p} onDelete={onDelete} onFavoriteToggle={onFavoriteToggle} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
