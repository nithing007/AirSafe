export function formatTime(isoStringOrTimestamp) {
  if (!isoStringOrTimestamp) return 'Just now';
  const date = new Date(isoStringOrTimestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(isoStringOrTimestamp) {
  if (!isoStringOrTimestamp) return '';
  const date = new Date(isoStringOrTimestamp);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' });
}

export function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Just now';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);

  if (diffMin < 1) return 'Just now';
  if (diffMin === 1) return '1 minute ago';
  if (diffMin < 60) return `${diffMin} minutes ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs === 1) return '1 hour ago';
  return `${diffHrs} hours ago`;
}
