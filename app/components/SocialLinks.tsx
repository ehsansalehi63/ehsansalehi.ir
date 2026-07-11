export default function SocialLinks() {
  const links = [
    { name: 'Telegram', url: 'https://t.me/ehsansalehi', icon: '📱' },
    { name: 'LinkedIn', url: 'https://linkedin.com/in/ehsansalehi', icon: '💼' },
    { name: 'GitHub', url: 'https://github.com/ehsansalehi', icon: '🐙' },
    { name: 'Email', url: 'mailto:info@ehsansalehi.ir', icon: '✉️' },
  ];
  return (
    <div className="flex justify-center gap-4 mt-4">
      {links.map((link) => (
        <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-orange-400 transition-colors text-2xl">
          {link.icon}
        </a>
      ))}
    </div>
  );
}
