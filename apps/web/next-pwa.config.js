import withPWA from 'next-pwa'

const config = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})({
  // your next config
});

export default config;
