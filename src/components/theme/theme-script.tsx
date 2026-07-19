const THEME_KEY = "leeklet-theme";

const script = `(function(){try{var s=localStorage.getItem('${THEME_KEY}')||'system';var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(s==='system'&&d)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}

export { THEME_KEY };
