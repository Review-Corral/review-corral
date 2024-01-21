export default function loading() {
  return (
    <div>
      <div className="space-y-4">
        {Array.from(Array(3).keys()).map((num) => (
          <div
            key={num}
            className="flex flex-row animate-pulse p-4 rounded-md bg-gray-100 text-gray-100"
          >
            <div className="truncate">{num}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
