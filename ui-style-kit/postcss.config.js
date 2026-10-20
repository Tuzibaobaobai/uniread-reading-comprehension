// 合并进目标项目已有的 postcss.config，不要删掉其它插件。
// 设计稿 1000px：视口更小时 px → vw 等比缩小，达到 1000px 后封顶为原始 px。
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
      // 桌面端全屏布局不做 fixed 定位矫正，避免与 body { position: fixed } 冲突
      appContainingBlock: 'manual',
    },
  },
};
