// components/Button.jsx
import { useSystemColors } from "../hooks/useSystemColors";

const Button = ({ children, onClick, type = "button", variant = "primary", disabled = false, loading = false }) => {
  const { colors } = useSystemColors();
  
  // Fallback colors
  const fallbackColors = {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  const currentColors = colors || fallbackColors;

  const getButtonStyle = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: currentColors.primary,
          color: 'white',
          '--hover-bg-color': `${currentColors.primary}dd`
        };
      case "secondary":
        return {
          backgroundColor: currentColors.secondary,
          color: 'white',
          '--hover-bg-color': `${currentColors.secondary}dd`
        };
      default:
        return {
          backgroundColor: currentColors.primary,
          color: 'white',
          '--hover-bg-color': `${currentColors.primary}dd`
        };
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 min-h-[48px] flex items-center justify-center gap-2 ${
        disabled || loading ? 'opacity-60 cursor-not-allowed hover:scale-100' : ''
      }`}
      style={getButtonStyle()}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          const style = getButtonStyle();
          e.target.style.backgroundColor = style['--hover-bg-color'];
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          const style = getButtonStyle();
          e.target.style.backgroundColor = style.backgroundColor;
        }
      }}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      )}
      {children}
    </button>
  );
};
  
  export default Button;