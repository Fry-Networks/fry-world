import { Stack, Heading, Box, Link, Text, Divider } from '@chakra-ui/react'

const Footer = () => {
  return (
    <Stack spacing='1rem' pb='4rem' align='center'>
      {/* <Heading as='h4' size='lg' pb='1rem'>Legal</Heading> */}
      <Stack flex direction={['column', 'row']} align='center'>
        <Box flex>
          <Link href='https://www.frynetworks.com/privacy-policy' target='_blank'>
            Privacy Policy
          </Link>
        </Box>
        <Divider orientation='vertical' height='1.3rem' display={{ base: 'none', sm: 'flex' }}/>
        <Box flex>
          <Link href='https://www.frynetworks.com/return-policy' target='_blank'>
            Return Policy
          </Link>
        </Box>
        <Divider orientation='vertical' height='1.3rem' display={{ base: 'none', sm: 'flex' }}/>
        <Box flex>
          <Link href='https://www.frynetworks.com/terms-conditions' target='_blank'>
            Terms & Conditions
          </Link>
        </Box>
      </Stack>
      <Stack flex direction={['column', 'row']} align='center'>
        <Box flex>
          <Link href='https://forms.gle/gZPvucrxDNjdCmMP7' target='_blank'>
            Listing Request
          </Link>
        </Box>
        <Divider orientation='vertical' height='1.3rem' display={{ base: 'none', sm: 'flex' }}/>
        <Box flex>
          <Link href='https://www.frynetworks.com/digital-item-policy' target='_blank'>
            Digital Item Policy
          </Link>
        </Box>
        <Divider orientation='vertical' height='1.3rem' display={{ base: 'none', sm: 'flex' }}/>
        <Box flex>
          <Link href='https://www.frynetworks.com/fry-world-disclaimer' target='_blank'>
            fry.world Disclaimer
          </Link>
        </Box>
        <Divider orientation='vertical' height='1.3rem' display={{ base: 'none', sm: 'flex' }}/>
        <Box flex>
          <Link href='https://www.frynetworks.com/bought-with-crypto-policy' target='_blank'>
            Bought With Crypto Policy
          </Link>
        </Box>
      </Stack>
    </Stack>
  )
}

export default Footer