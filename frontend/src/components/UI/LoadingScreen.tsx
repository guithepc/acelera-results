export default function LoadingScreen() {
  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'radial-gradient(ellipse at center, #0a0f1e 0%, #020408 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '3px solid transparent',
        borderTopColor: '#34d399',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 10, color: '#34d399',
        textShadow: '0 0 10px #34d39988',
      }}>
        carregando o mapa...
      </p>
    </div>
  );
}
