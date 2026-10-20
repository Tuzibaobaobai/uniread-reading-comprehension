// From ui-style-kit/postcss.config.js (GitHub #62): design width 1000px — below it px → vw (font sizes too),
// at 1000px and above capped at the original px. RC's own breakpoints (tabs below 1024px, …) still apply on top.
export default {
  plugins: {
    'postcss-mobile-forever': {
      viewportWidth: 1000,
      maxDisplayWidth: 1000,
      unitPrecision: 3,
      // 含 font-size。不要改成排除字体。
      propList: ['*'],
      // 选择器带 no-vw，或类名 .hairlines，不参与转换
      selectorBlackList: [/no-vw/, '.hairlines'],
      exclude: [/node_modules/],
      // 与 body { position: fixed } 搭配，不做 fixed 定位矫正
      appContainingBlock: 'manual',
    },
  },
};
