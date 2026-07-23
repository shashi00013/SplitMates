export default function Avatar({ user, size = 'md', selected = false, className = '' }) {
  if (!user) return null;

  const initial = user.firstName ? user.firstName[0] : user.name ? user.name[0] : '?';
  const sizeClass = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : size === 'xl' ? 'avatar-xl' : '';
  const selectedClass = selected ? 'avatar-selected' : '';
  const bgColor = user.color || '#CCFF00';

  return (
    <div
      className={`avatar ${sizeClass} ${selectedClass} ${className}`}
      style={{ backgroundColor: bgColor, borderColor: selected ? '#CCFF00' : bgColor + '44' }}
    >
      {initial}
    </div>
  );
}
