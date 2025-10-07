import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases } from 'vuetify/iconsets/md'
import {mdi} from "vuetify/iconsets/mdi";

export default createVuetify({
    theme: {
        defaultTheme: 'dark',
        themes: {
            dark: {
                dark: true,
                colors: {
                    background: '#616161',
                    surface: '#ffffff',
                    primary: '#5AC8FA',
                    secondary: '#a8cbff',
                    accent: '#00E5FF',
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