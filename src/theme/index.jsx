import { extendTheme } from "@chakra-ui/react"
import { modalAnatomy as parts } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/styled-system'

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(parts.keys)

const baseStyle = definePartsStyle({
  // define the part you're going to style
  dialog: {
    borderRadius: 'md',
    bg: '#0B1D33',
  },
})

export const modalTheme = defineMultiStyleConfig({
  baseStyle,
})

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  colors: {
    primary: '#ff0000',
  },
  fonts: {
    heading: `'Intro Black', sans-serif`,
    body: `'Intro Regular', sans-serif`,
  },
  styles: {
    global: {
      body: {
        // bg: '#030B15',
        bg: '#111111',
      },
      p: {
        m: 0,
      },
    },
  },
  components: { Modal: modalTheme},
})

window.localStorage.removeItem("chakra-ui-color-mode")

export default theme
