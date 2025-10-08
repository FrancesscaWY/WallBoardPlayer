// plugins/vuetify.ts
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases } from 'vuetify/iconsets/md'
import { mdi } from 'vuetify/iconsets/mdi'

export default createVuetify({
    theme: {
        defaultTheme: 'swuLight',
        themes: {
            swuLight: {
                dark: false,
                colors: {
                    // 基础
                    background: '#F5F8FC',   // 浅冷白（页面背景）
                    surface:    '#FFFFFF',   // 组件表面
                    outline:    '#9FA6AD',   // 专银色（近似 Pantone 7543C）

                    // 品牌色
                    primary:   '#003D83',    // 西大蓝
                    secondary: '#007FC6',    // 弘远蓝
                    info:      '#7FCDEC',    // 晴朗蓝
                    warning:   '#DAB983',    // 大地金
                    error:     '#AE2223',    // 引领红

                    // 可选扩展（用作柔和底/容器）
                    primaryContainer:   '#EEF3FA',
                    secondaryContainer: '#E6F3FB',
                },
            },

            swuDark: {
                dark: true,
                colors: {
                    background: '#0E1726',   // 深蓝灰背景
                    surface:    '#101B2D',   // 深表面
                    outline:    '#9FA6AD',

                    primary:   '#7FCDEC',    // 深色模式下提高可读性，用晴朗蓝当主按钮色
                    secondary: '#007FC6',
                    info:      '#7FCDEC',
                    warning:   '#DAB983',
                    error:     '#E04944',    // 引领红的亮一点版本以增强对比
                },
            },
        },
    },
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: { mdi },
    },
})
