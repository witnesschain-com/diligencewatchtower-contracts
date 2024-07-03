"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
// https://vitest.dev/config/ - for docs
exports.default = (0, config_1.defineConfig)({
    test: {
        setupFiles: './setupVitest.ts',
        include: ['test-next/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    },
});
