const config = {
    '*.{js,ts,tsx}': ['npm run lint:eslint', 'npm run format:check'],
    '*.css': ['npm run lint:stylelint', 'npm run format:check'],
    '*.{json,html,md,yml,yaml}': ['npm run format:check']
}

export default config
