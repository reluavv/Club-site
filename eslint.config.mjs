import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
    ...nextVitals,
    {
        // These come from the React Compiler preset; the app doesn't use the compiler.
        rules: {
            "react-hooks/set-state-in-effect": "off",
            "react-hooks/immutability": "off",
            "react-hooks/purity": "off",
        },
    },
    { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
];

export default eslintConfig;
