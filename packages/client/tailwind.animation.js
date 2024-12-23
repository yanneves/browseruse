import plugin from "tailwindcss/plugin";

export default plugin(({ matchUtilities, theme }) => {
  matchUtilities(
    { "animate-delay": (value) => ({ animationDelay: value }) },
    { values: theme("transitionDelay") },
  );
});
