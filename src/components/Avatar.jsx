export default function Avatar({ user, size = 'md', selected = false, className = '', onClick }) {
  if (!user) return null;

  const isImage = typeof user.avatar === 'string' && (
    user.avatar.startsWith('data:image/') ||
    user.avatar.startsWith('http://') ||
    user.avatar.startsWith('https://') ||
    user.avatar.startsWith('blob:')
  );

  const initial = user.firstName ? user.firstName[0] : user.name ? user.name[0] : '?';
  const displayContent = isImage ? null : (user.avatar || initial);

  const sizeClass = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : size === 'xl' ? 'avatar-xl' : '';
  const selectedClass = selected ? 'avatar-selected' : '';
  const bgColor = user.color || '#CCFF00';

  return (
    <div
      className={`avatar ${sizeClass} ${selectedClass} ${className}`}
      onClick={onClick}
      style={{
        backgroundColor: bgColor,
        borderColor: selected ? 'var(--accent)' : bgColor + '44',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {isImage ? (
        <img
          src={user.avatar}
          alt={user.name || 'User Avatar'}
          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
        />
      ) : (
        <span style={{ fontSize: size === 'xl' ? '1.8rem' : size === 'lg' ? '1.4rem' : '1rem' }}>
          {displayContent}
        </span>
      )}
    </div>
  );
}
